import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="bg-cream">
      <section className="section">
        <div className="container-narrow">
          <span className="badge-sage mb-4">Privacy</span>
          <h1 className="heading-display text-display-lg text-ink-900 mb-10">
            Your data,<br /><em>not ours</em>.
          </h1>
          <p className="text-xl text-ink-700 leading-relaxed mb-8">
            No account. No tracking. No storage. The code is open source.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow text-center">
          <Link to="/assessment" className="btn-primary">Begin assessment →</Link>
        </div>
      </section>
    </div>
  )
}