import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-ink-950 text-cream pt-20 pb-10">
      <div className="container-editorial">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-6">
            <Link to="/" className="inline-block">
              <h2 className="font-display text-7xl md:text-8xl leading-none italic tracking-tight">
                Mira.
              </h2>
              <p className="text-xs uppercase tracking-[0.25em] text-cream/60 mt-3">
                Anxiety Risk Insights
              </p>
            </Link>
            <p className="mt-8 text-cream/70 max-w-md leading-relaxed">
              A research-grade multi-modal assessment. Free, private, instant.
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs uppercase tracking-[0.18em] text-cream/40 mb-5">Explore</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/assessment" className="text-cream/80 hover:text-cream">Assessment</Link></li>
              <li><Link to="/about" className="text-cream/80 hover:text-cream">About</Link></li>
              <li><Link to="/methodology" className="text-cream/80 hover:text-cream">Methodology</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs uppercase tracking-[0.18em] text-cream/40 mb-5">Research</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/privacy" className="text-cream/80 hover:text-cream">Privacy</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs uppercase tracking-[0.18em] text-cream/40 mb-5">Project</h3>
            <ul className="space-y-3 text-sm">
              <li className="text-cream/80">BRAC University</li>
              <li className="text-cream/80">CSE Thesis 2026</li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-cream/15 mb-6" />
        <div className="flex flex-col md:flex-row justify-between gap-4 text-xs text-cream/50">
          <p>© 2026 Mira Research. Not a substitute for medical advice.</p>
          <p className="font-mono">v1.0.0</p>
        </div>
      </div>
    </footer>
  )
}