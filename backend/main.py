import os
import json
from pathlib import Path
from contextlib import asynccontextmanager

import joblib
import numpy as np
import shap
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List

MODELS_DIR = Path(__file__).parent / "models"
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

MODELS = {}


def load_artifacts():
    print("Loading model artifacts...")
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
        MODELS['anxiety_model'],
        MODELS['shap_background']
    )
    print(f"Loaded {len(MODELS['anxiety_features'])} features. Ready.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_artifacts()
    yield


app = FastAPI(title="Anxiety Prediction API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FeatureInputs(BaseModel):
    PHQ_9: Optional[float] = None
    GAD_7: Optional[float] = None
    CES_D: Optional[float] = None
    STAI_X2: Optional[float] = None
    CTQ_2: Optional[float] = None
    BRIAN: Optional[float] = None
    BSQ: Optional[float] = None
    ACQ: Optional[float] = None
    suicideHx: Optional[float] = None
    negative: Optional[float] = None
    negative_E: Optional[float] = None
    positive: Optional[float] = None
    positive_E: Optional[float] = None
    annoying: Optional[float] = None
    sleep_duration: Optional[float] = None
    sleep_efficiency: Optional[float] = None
    total_steps: Optional[float] = None
    HR_mean: Optional[float] = None
    HR_var: Optional[float] = None
    deep_sleep_min: Optional[float] = None
    age: Optional[float] = None

    class Config:
        extra = "allow"


def build_feature_vector(inputs):
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


def get_risk_level(prob):
    if prob >= 0.7: return "HIGH"
    if prob >= 0.4: return "MODERATE"
    return "LOW"


def get_recommendation(risk):
    recs = {
        "HIGH": {
            "interpretation": "Your data suggests elevated anxiety risk for tomorrow.",
            "recommendation": "Consider proactive intervention: grounding exercises, deep breathing, or reach out to a clinician.",
        },
        "MODERATE": {
            "interpretation": "Your data indicates moderate anxiety risk.",
            "recommendation": "Maintain self-care: adequate sleep, light exercise, mindfulness practice.",
        },
        "LOW": {
            "interpretation": "Your data suggests low anxiety risk for tomorrow.",
            "recommendation": "Continue your regular routine. Daily monitoring builds awareness.",
        }
    }
    return recs[risk]


@app.get("/")
def root():
    return {"name": "Anxiety Prediction API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": len(MODELS) > 0}


@app.get("/features")
def get_features():
    return {
        "features": MODELS['feature_metadata'],
        "feature_order": MODELS['anxiety_features']
    }


@app.get("/performance")
def get_performance():
    return MODELS['performance']


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
        
        return {
            "probability": round(prob, 4),
            "top_contributions": contributions[:top_n],
            "base_value": float(MODELS['shap_explainer'].expected_value)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)