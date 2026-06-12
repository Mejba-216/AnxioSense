import { Link } from 'react-router-dom'

export default function Methodology() {
  return (
    <div className="bg-cream">
      <section className="section">
        <div className="container-narrow">
          <span className="badge-coral mb-4">Methodology</span>
          <h1 className="heading-display text-display-lg text-ink-900 mb-8">
            The full critique,<br /><em>step by step</em>.
          </h1>
          <p className="text-xl text-ink-700 leading-relaxed">
            The proposed methodology is a structured and leakage-aware framework that is designed to investigate the reliability, interpretability, and personalization potential of digital phenotyping systems for mental health prediction. These six stages that comprise a 5+ stage workflow: data collection and preprocessing, leakage-aware evaluation, target selection, ML model development, explainability analysis, and personalization. The first step of the study is to collect and preprocess a longitudinal multimodal digital phenotyping dataset that includes behavioral, physiological, clinical, demographic, and self-reported mood data. The raw data from wearables, smartphone-based assessments, and clinical questionnaires are preprocessed, trans formed, and integrated into a harmonized anatomical feature space for machine learning. The original panic prediction framework is first reproduced and rigorously assessed in a Stratified K-Fold and subject-independent Group K-Fold validation to ascertain reliable performance estimation. We quantify the strategy we created and the effect of this data leakage at the patient level with the following analysis and define Group K-Fold as the primary evaluation protocol for all future experiments. The model is evaluated with a multi-discovery target selection model for the ideal mental health outcome to perform the prediction after leakage analysis. The predictability, relevance, and suitability of candidate targets for an individual modelling approach are assessed from statistical, clinical, and personalization perspectives. Then, a lot of machine learning models are developed and evaluated (through leakage-free validation) on the selected target: Logistic Regression, Random Forest, Gradient Boosting and XGBoost. Interpretability analysis using SHAP is subsequently conducted, identifying key predictors that contribute to model behavior. Lastly, the review gives a range of personalization strategies including calibration based methods, mixed effects modeling, and meta-learning methods as well as the Patient-Similarity-Based Calibration (PS-Cal) framework proposed in the paper to tackle inter-individual variability to enhance prediction reliability. The resulting framework is packaged as a prototype application, showcasing data-informed and explainable decision support for personalized anxiety prediction in the context of digital mental health monitoring 

          </p>
        </div>
      </section>

      <section className="section bg-ink-950 text-cream">
        <div className="container-editorial">
          <h2 className="heading-display text-display-md mb-12">
            27.3% inflation,<br />
            <em className="text-coral-300">hiding in plain sight</em>.
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-display text-2xl mb-4">StratifiedKFold</h3>
              <p className="text-cream/70 mb-6">Same patient appears in both training and test folds.</p>
              <div className="border border-cream/15 p-5">
                <div className="text-xs uppercase text-cream/40 mb-2">Reported AUC</div>
                <div className="font-display text-3xl text-cream">0.906</div>
              </div>
            </div>
            <div>
              <h3 className="font-display text-2xl mb-4">GroupKFold</h3>
              <p className="text-cream/70 mb-6">Each patient appears in exactly one fold.</p>
              <div className="border border-cream/15 p-5">
                <div className="text-xs uppercase text-cream/40 mb-2">Honest AUC</div>
                <div className="font-display text-3xl text-cream">0.646</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow text-center">
          <Link to="/assessment" className="btn-primary">Try the assessment →</Link>
        </div>
      </section>
    </div>
  )
}