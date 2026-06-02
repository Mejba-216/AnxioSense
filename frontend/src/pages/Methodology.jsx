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
            We replicate the original paper, identify the leakage, and propose anxiety as a better target.
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