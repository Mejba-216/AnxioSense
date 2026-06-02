import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Landing() {
  return (
    <div className="bg-cream">
      {/* HERO */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="container-editorial relative">
          <div className="flex flex-wrap gap-x-8 gap-y-2 mb-12 text-xs uppercase tracking-[0.2em] text-ink-500">
            <span>—</span>
            <span>Vol.01</span>
            <span>BRAC University · 2026</span>
            <span>Multi-Modal Digital Phenotyping</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-9">
              <h1 className="heading-display text-display-xl text-ink-900">
                Tomorrow's<br />
                <span className="italic font-normal">anxiety</span>, foreseen<br />
                in today's <span className="italic font-normal">data.</span>
              </h1>
            </div>
            <div className="md:col-span-3 md:pb-6">
              <p className="text-ink-600 leading-relaxed text-sm">
                A research-grade assessment combining clinical scales, today's mood,
                and wearable signals — to estimate anxiety probability.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-16 flex flex-col sm:flex-row gap-4">
            <Link to="/assessment" className="btn-primary group">
              Begin the assessment
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/methodology" className="btn-secondary">Read the methodology</Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-200">
            {[
              { value: '0.920', label: 'AUC under proper evaluation' },
              { value: '43', label: 'Mood disorder patients' },
              { value: '0.806', label: 'F1 score, zero leakage' },
              { value: '27.3%', label: 'Inflation in prior work, exposed' },
            ].map((stat, i) => (
              <div key={i} className="bg-cream p-6 md:p-8 numbered-marker">
                <div className="font-display text-4xl md:text-5xl tracking-tight mb-2 text-ink-900">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-[0.15em] text-ink-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section bg-paper border-y border-ink-200">
        <div className="container-editorial">
          <span className="badge-sage mb-4">§ 01 — Process</span>
          <h2 className="heading-display text-display-md text-ink-900 mb-16">
            Three modalities.<br />
            <span className="italic">One signal.</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-ink-200">
            {[
              { num: '01', title: 'Clinical Baseline', items: ['PHQ-9', 'GAD-7', 'STAI', 'CTQ'] },
              { num: '02', title: "Today's Mood", items: ['Negative affect', 'Energy', 'Irritability', 'Stress'] },
              { num: '03', title: "Yesterday's Sensors", items: ['Sleep', 'Steps', 'HR variability', 'Deep sleep'] },
            ].map((m) => (
              <div key={m.num} className="bg-cream p-8 md:p-10">
                <div className="font-mono text-xs text-ink-500 mb-4">{m.num} / 03</div>
                <h3 className="font-display text-2xl text-ink-900 mb-6">{m.title}</h3>
                <ul className="space-y-2">
                  {m.items.map((item, i) => (
                    <li key={i} className="text-sm text-ink-700 flex gap-3">
                      <span className="text-ink-400">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section">
        <div className="container-narrow text-center">
          <h2 className="heading-display text-display-lg text-ink-900 mb-8">
            Ready for your<br />
            <span className="italic">first reading?</span>
          </h2>
          <p className="text-ink-600 mb-10">No accounts. No tracking. About four minutes.</p>
          <Link to="/assessment" className="btn-primary group inline-flex">
            Begin Assessment
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  )
}