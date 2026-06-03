import os
import json
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import timedelta

import joblib
import numpy as np
import shap
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from typing import Optional, List

from database import init_db, get_db, User, Assessment
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)

# ============================================================================
# CONFIGURATION
# ============================================================================
MODELS_DIR = Path(__file__).parent / "models"
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

MODELS = {}


# ============================================================================
# MODEL LOADING
# ============================================================================
def load_artifacts():
    print("Loading model artifacts...")
    
    # Core anxiety model
    MODELS['anxiety_model'] = joblib.load(MODELS_DIR / 'anxiety_model.pkl')
    MODELS['anxiety_scaler'] = joblib.load(MODELS_DIR / 'anxiety_scaler.pkl')
    
    with open(MODELS_DIR / 'anxiety_features.json') as f:
        MODELS['anxiety_features'] = json.load(f)
    with open(MODELS_DIR / 'feature_metadata.json') as f:
        MODELS['feature_metadata'] = json.load(f)
    with open(MODELS_DIR / 'feature_importance_anxiety.json') as f:
        MODELS['feature_importance'] = json.load(f)
    
    MODELS['shap_background'] = np.load(MODELS_DIR / 'shap_background_anxiety.npy')
    
    with open(MODELS_DIR / 'performance_metrics.json') as f:
        MODELS['performance'] = json.load(f)
    
    MODELS['shap_explainer'] = shap.LinearExplainer(
        MODELS['anxiety_model'], MODELS['shap_background']
    )
    
    # ── PERSONALIZATION ARTIFACTS ──
    try:
        with open(MODELS_DIR / 'patient_profiles.json') as f:
            MODELS['patient_profiles'] = json.load(f)
        with open(MODELS_DIR / 'personalization_config.json') as f:
            MODELS['personalization_config'] = json.load(f)
        MODELS['profile_mean'] = np.load(MODELS_DIR / 'profile_mean.npy')
        MODELS['profile_std'] = np.load(MODELS_DIR / 'profile_std.npy')
        
        # NEW: Load per-patient calibration data
        with open(MODELS_DIR / 'patient_calibration_data.json') as f:
            MODELS['patient_calibration_data'] = json.load(f)
        
        eligible = sum(1 for d in MODELS['patient_calibration_data'].values() 
                       if len(d['predictions']) >= 4)
        print(f"Personalization loaded: {len(MODELS['patient_profiles'])} patient profiles, "
              f"{eligible} eligible for PS-Cal (≥4 observations)")
    except FileNotFoundError as e:
        print(f"WARNING: Personalization files missing: {e}")
    
    print(f"Loaded {len(MODELS['anxiety_features'])} features. Ready.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    load_artifacts()
    yield


# ============================================================================
# APP SETUP
# ============================================================================
app = FastAPI(title="Mira API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class FeatureInputs(BaseModel):
    # Clinical scales
    PHQ_9: Optional[float] = None
    GAD_7: Optional[float] = None
    CES_D: Optional[float] = None
    STAI_X2: Optional[float] = None
    CTQ_2: Optional[float] = None
    BRIAN: Optional[float] = None
    BSQ: Optional[float] = None
    ACQ: Optional[float] = None
    suicideHx: Optional[float] = None
    
    # Today's mood
    negative: Optional[float] = None
    negative_E: Optional[float] = None
    positive: Optional[float] = None
    positive_E: Optional[float] = None
    annoying: Optional[float] = None
    
    # Sensors
    sleep_duration: Optional[float] = None
    sleep_efficiency: Optional[float] = None
    total_steps: Optional[float] = None
    HR_mean: Optional[float] = None
    HR_var: Optional[float] = None
    deep_sleep_min: Optional[float] = None
    
    # Demographics
    age: Optional[float] = None
    
    class Config:
        extra = "allow"


class SaveAssessmentRequest(BaseModel):
    inputs: dict
    probability: float
    risk_level: str


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def build_feature_vector(inputs: FeatureInputs):
    """Build feature vector in correct order. Missing values default to median."""
    feature_dict = inputs.dict(exclude_none=False)
    metadata = MODELS['feature_metadata']
    features_order = MODELS['anxiety_features']
    
    vector = []
    for f in features_order:
        if f in feature_dict and feature_dict[f] is not None:
            vector.append(feature_dict[f])
        elif f in metadata:
            vector.append(metadata[f]['median'])
        else:
            vector.append(0.0)
    return np.array([vector])


def get_risk_level(prob: float) -> str:
    if prob >= 0.7:
        return "HIGH"
    if prob >= 0.4:
        return "MODERATE"
    return "LOW"


def get_recommendation(risk: str) -> dict:
    recs = {
        "HIGH": {
            "interpretation": (
                "Your data suggests elevated anxiety risk for tomorrow. "
                "Multiple indicators align with patterns that have preceded "
                "anxiety episodes in similar patients."
            ),
            "recommendation": (
                "Consider proactive intervention: practice grounding exercises, "
                "deep breathing, or brief mindfulness. If you have a therapist "
                "or clinician, this may be a good time to reach out."
            )
        },
        "MODERATE": {
            "interpretation": (
                "Your data indicates moderate anxiety risk. Some patterns "
                "suggest mild elevation but no acute warning signs."
            ),
            "recommendation": (
                "Maintain regular self-care: adequate sleep, light exercise, "
                "and connection with supportive people. A brief mindfulness "
                "or relaxation practice could be helpful."
            )
        },
        "LOW": {
            "interpretation": (
                "Your data suggests low anxiety risk for tomorrow. Indicators "
                "appear within typical baseline ranges."
            ),
            "recommendation": (
                "Continue your regular routine. Self-monitoring remains "
                "valuable — small daily check-ins build long-term awareness."
            )
        }
    }
    return recs[risk]


# ============================================================================
# ROOT & HEALTH
# ============================================================================
@app.get("/")
def root():
    return {"name": "Mira API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": len(MODELS) > 0}


# ============================================================================
# AUTH ENDPOINTS
# ============================================================================
@app.post("/auth/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        name=user_data.name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": user.email})
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, name=user.name)
    )


@app.post("/auth/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token({"sub": user.email})
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, name=user.name)
    )


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, email=current_user.email, name=current_user.name)


# ============================================================================
# PREDICTION ENDPOINTS (public — no auth required)
# ============================================================================
@app.get("/features")
def get_features():
    return {
        "features": MODELS['feature_metadata'],
        "feature_order": MODELS['anxiety_features']
    }


@app.get("/performance")
def get_performance():
    return MODELS['performance']


@app.get("/feature-importance")
def get_feature_importance(top_n: int = 15):
    return {"top_features": MODELS['feature_importance'][:top_n]}


@app.post("/predict")
def predict(inputs: FeatureInputs):
    try:
        X = build_feature_vector(inputs)
        X_scaled = MODELS['anxiety_scaler'].transform(X)
        prob = float(MODELS['anxiety_model'].predict_proba(X_scaled)[0][1])
        risk = get_risk_level(prob)
        rec = get_recommendation(risk)
        return {
            "probability": round(prob, 4),
            "risk_level": risk,
            "confidence": "High" if abs(prob - 0.5) > 0.3 else "Moderate",
            "interpretation": rec["interpretation"],
            "recommendation": rec["recommendation"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/explain")
def explain(inputs: FeatureInputs, top_n: int = 10):
    try:
        X = build_feature_vector(inputs)
        X_scaled = MODELS['anxiety_scaler'].transform(X)
        prob = float(MODELS['anxiety_model'].predict_proba(X_scaled)[0][1])
        
        shap_values = MODELS['shap_explainer'].shap_values(X_scaled)
        feature_names = MODELS['anxiety_features']
        
        contributions = []
        for i, name in enumerate(feature_names):
            contributions.append({
                'feature': name,
                'value': float(X[0][i]),
                'contribution': float(shap_values[0][i]),
                'direction': 'increases' if shap_values[0][i] > 0 else 'decreases'
            })
        contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
        
        risk = get_risk_level(prob)
        rec = get_recommendation(risk)
        
        return {
            "probability": round(prob, 4),
            "risk_level": risk,
            "confidence": "High" if abs(prob - 0.5) > 0.3 else "Moderate",
            "interpretation": rec["interpretation"],
            "recommendation": rec["recommendation"],
            "top_contributions": contributions[:top_n],
            "base_value": float(MODELS['shap_explainer'].expected_value)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
#Personalization

@app.post("/predict-personalized")
def predict_personalized(inputs: FeatureInputs, top_n: int = 10):
    """
    Selective Patient-Similarity Calibration with heuristic gatekeeper.
    
    Gatekeeper rules (validated by negative result on trained meta-classifier):
    1. At least 5 similar patients with calibration data
    2. Average similarity >= 0.70 (profile close to training cohort)
    3. Calibration data has outcome variation (can fit Isotonic)
    4. Adjustment >= 0.05 (meaningful effect, not noise)
    """
    try:
        from sklearn.isotonic import IsotonicRegression
        
        X = build_feature_vector(inputs)
        X_scaled = MODELS['anxiety_scaler'].transform(X)
        global_prob = float(MODELS['anxiety_model'].predict_proba(X_scaled)[0][1])
        
        config = MODELS.get('personalization_config', {})
        core_features = config.get('core_features', [])
        patient_profiles = MODELS.get('patient_profiles', {})
        calibration_data = MODELS.get('patient_calibration_data', {})
        
        default_response = {
            "global_probability": round(global_prob, 4),
            "personalized_probability": round(global_prob, 4),
            "recommended_probability": round(global_prob, 4),
            "recommended_method": "global",
            "adjustment": 0.0,
            "personalization_available": False,
            "use_personalization": False,
            "gatekeeper_reason": "Insufficient data for personalization",
            "effect_level": "Unavailable",
            "similar_patients_count": 0,
            "calibration_observations": 0,
            "max_similarity": 0.0,
            "avg_similarity": 0.0,
        }
        
        if not core_features or not patient_profiles or not calibration_data:
            return {**default_response, "interpretation": "Personalization data not available."}
        
        # Build profile (with scale normalization)
        input_dict = inputs.dict(exclude_none=False)
        metadata = MODELS['feature_metadata']
        SCALE_FACTORS = {
            'PHQ_9': 27.0, 'GAD_7': 21.0, 'CES_D': 60.0,
            'CTQ_2': 25.0, 'BSQ': 100.0, 'ACQ': 100.0,
        }
        profile = []
        for feat in core_features:
            if feat in input_dict and input_dict[feat] is not None:
                raw_value = float(input_dict[feat])
                scale = SCALE_FACTORS.get(feat, 1.0)
                value = raw_value / scale if scale > 1 else raw_value
                profile.append(value)
            elif feat in metadata:
                profile.append(float(metadata[feat]['median']))
            else:
                profile.append(0.0)
        
        profile = np.array(profile, dtype=float)
        profile_mean = np.array(MODELS['profile_mean'], dtype=float)
        profile_std = np.array(MODELS['profile_std'], dtype=float)
        profile_std = np.where(profile_std < 1e-8, 1.0, profile_std)
        profile_norm = (profile - profile_mean) / profile_std
        
        sigma = 3.0
        
        # Compute similarities
        similarities = []
        for pid, p in patient_profiles.items():
            try:
                if pid not in calibration_data:
                    continue
                if len(calibration_data[pid]['predictions']) < 4:
                    continue
                p_vec = np.array([float(p[f]) for f in core_features], dtype=float)
                p_norm = (p_vec - profile_mean) / profile_std
                diff = profile_norm - p_norm
                dist_sq = float(np.sum(diff ** 2))
                if not np.isfinite(dist_sq):
                    continue
                sim = float(np.exp(-dist_sq / (2 * sigma ** 2)))
                if np.isfinite(sim):
                    similarities.append((pid, sim))
            except (KeyError, ValueError, TypeError):
                continue
        
        # ── GATEKEEPER RULE 1: Need at least 5 similar patients ──
        if len(similarities) < 5:
            return {
                **default_response,
                "gatekeeper_reason": f"Only {len(similarities)} similar patients found (rule: ≥5 required)",
                "interpretation": "Not enough similar patients in our cohort. Using standard prediction."
            }
        
        similarities.sort(key=lambda x: -x[1])
        K = min(10, len(similarities))
        top_k = similarities[:K]
        max_sim = top_k[0][1]
        avg_sim = float(np.mean([s for _, s in top_k]))
        
        # ── GATEKEEPER RULE 2: Average similarity must be >= 70% ──
        if avg_sim < 0.70:
            return {
                **default_response,
                "personalization_available": True,
                "use_personalization": False,
                "similar_patients_count": K,
                "max_similarity": round(max_sim, 4),
                "avg_similarity": round(avg_sim, 4),
                "gatekeeper_reason": f"Profile is atypical (avg similarity {round(avg_sim*100)}%, rule: ≥70%)",
                "interpretation": (
                    f"Your profile is somewhat atypical (only {round(avg_sim*100)}% similarity to nearest patients). "
                    "Personalization would be unreliable. Using standard prediction."
                )
            }
        
        # Build calibration set
        all_predictions, all_outcomes, all_weights = [], [], []
        for pid, sim in top_k:
            cal = calibration_data[pid]
            for pred, out in zip(cal['predictions'], cal['outcomes']):
                all_predictions.append(pred)
                all_outcomes.append(out)
                all_weights.append(sim)
        
        all_predictions = np.array(all_predictions, dtype=float)
        all_outcomes = np.array(all_outcomes, dtype=float)
        all_weights = np.array(all_weights, dtype=float)
        
        # ── GATEKEEPER RULE 3: Need outcome variation ──
        if all_outcomes.sum() == 0 or all_outcomes.sum() == len(all_outcomes):
            return {
                **default_response,
                "personalization_available": True,
                "use_personalization": False,
                "similar_patients_count": K,
                "max_similarity": round(max_sim, 4),
                "avg_similarity": round(avg_sim, 4),
                "gatekeeper_reason": "Similar patients had uniform outcomes (no learnable signal)",
                "interpretation": "Standard prediction is most reliable for your profile."
            }
        
        # Fit Isotonic Regression
        try:
            iso = IsotonicRegression(out_of_bounds='clip', y_min=0.001, y_max=0.999)
            iso.fit(all_predictions, all_outcomes, sample_weight=all_weights)
            personalized_prob = float(iso.predict([global_prob])[0])
            personalized_prob = float(np.clip(personalized_prob, 0.01, 0.99))
        except Exception:
            return {
                **default_response,
                "personalization_available": True,
                "use_personalization": False,
                "similar_patients_count": K,
                "max_similarity": round(max_sim, 4),
                "avg_similarity": round(avg_sim, 4),
                "gatekeeper_reason": "Calibration fit failed",
                "interpretation": "Using standard prediction."
            }
        
        adjustment = personalized_prob - global_prob
        abs_adj = abs(adjustment)
        
        # ── GATEKEEPER RULE 4: Adjustment must be ≥ 5% ──
        if abs_adj < 0.05:
            return {
                "global_probability": round(global_prob, 4),
                "personalized_probability": round(personalized_prob, 4),
                "recommended_probability": round(global_prob, 4),
                "recommended_method": "global",
                "adjustment": round(adjustment, 4),
                "personalization_available": True,
                "use_personalization": False,
                "effect_level": "Minimal",
                "similar_patients_count": K,
                "calibration_observations": len(all_predictions),
                "max_similarity": round(max_sim, 4),
                "avg_similarity": round(avg_sim, 4),
                "gatekeeper_reason": f"Adjustment too small ({round(abs_adj*100)}%, rule: ≥5%)",
                "interpretation": (
                    f"Your profile is similar to {K} patients ({len(all_predictions)} observations). "
                    f"Personalization would change the prediction by only {round(abs_adj*100)}% — "
                    f"below our reliability threshold. Using standard prediction."
                )
            }
        
        # ── ALL GATEKEEPER RULES PASSED: Use personalized ──
        if abs_adj >= 0.10:
            effect_level = "Large"
        elif abs_adj >= 0.05:
            effect_level = "Moderate"
        
        direction = "UNDER-estimating" if adjustment > 0 else "OVER-estimating"
        
        return {
            "global_probability": round(global_prob, 4),
            "personalized_probability": round(personalized_prob, 4),
            "recommended_probability": round(personalized_prob, 4),
            "recommended_method": "personalized",
            "adjustment": round(adjustment, 4),
            "personalization_available": True,
            "use_personalization": True,
            "effect_level": effect_level,
            "similar_patients_count": K,
            "calibration_observations": len(all_predictions),
            "max_similarity": round(max_sim, 4),
            "avg_similarity": round(avg_sim, 4),
            "gatekeeper_reason": (
                f"All checks passed: {K} similar patients "
                f"({round(avg_sim*100)}% match), {effect_level.lower()} adjustment."
            ),
            "interpretation": (
                f"Based on outcomes from {K} similar patients ({len(all_predictions)} observations), "
                f"the standard model may be {direction} your risk by {round(abs_adj*100)}%. "
                f"The personalized estimate is more reliable for your profile."
            )
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Personalization error: {str(e)}")
# ============================================================================
# USER ASSESSMENT HISTORY (auth required)
# ============================================================================
@app.post("/assessments/save")
def save_assessment(
    data: SaveAssessmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = Assessment(
        user_id=current_user.id,
        inputs=data.inputs,
        probability=data.probability,
        risk_level=data.risk_level,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return {
        "id": assessment.id,
        "created_at": assessment.created_at.isoformat() if assessment.created_at else None
    }


@app.get("/assessments/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": a.id,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "probability": a.probability,
            "risk_level": a.risk_level,
        }
        for a in assessments
    ]


# ============================================================================
# DEVELOPMENT SERVER
# ============================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)