import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="bg-cream">
      <section className="section">
        <div className="container-narrow">
          <span className="badge-sage mb-4">About</span>
          <h1 className="heading-display text-display-lg text-ink-900 mb-10">
            A research thesis,<br />
            made <em>useful</em>.
          </h1>
          <p className="text-xl text-ink-700 leading-relaxed mb-8">
            Mira is the public-facing outcome of an undergraduate thesis at
            BRAC University on multi-modal digital phenotyping.
          </p>
        </div>
      </section>

      <section className="section bg-paper border-y border-ink-200">
        <div className="container-editorial">
          <h2 className="heading-display text-display-md text-ink-900 mb-12">
            Model performance.
          </h2>
          <div className="grid md:grid-cols-4 gap-px bg-ink-200">
            {[
              { metric: 'AUC', value: '0.920' },
              { metric: 'F1', value: '0.806' },
              { metric: 'Recall', value: '0.802' },
              { metric: 'Precision', value: '0.827' },
            ].map((s, i) => (
              <div key={i} className="bg-cream p-8">
                <div className="text-xs uppercase tracking-[0.15em] text-ink-500 mb-3">{s.metric}</div>
                <div className="font-display text-5xl text-ink-900 numbered-marker">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow text-center">
          <Link to="/methodology" className="btn-primary">See the methodology →</Link>
        </div>
      </section>
    </div>
  )
}