import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Results() {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('mira_result')
    if (!stored) { navigate('/assessment'); return }
    setResult(JSON.parse(stored))
  }, [navigate])

  if (!result) return null

  const prob = result.probability
  const pct = Math.round(prob * 100)
  const risk = prob >= 0.7 ? 'HIGH' : prob >= 0.4 ? 'MODERATE' : 'LOW'
  const colors = {
    HIGH: { stroke: '#d4422a', text: 'text-coral-700', bg: 'bg-coral-50' },
    MODERATE: { stroke: '#d6841d', text: 'text-amber-700', bg: 'bg-amber-50' },
    LOW: { stroke: '#5a8865', text: 'text-sage-700', bg: 'bg-sage-50' },
  }[risk]

  const radius = 100
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - prob)

  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="container-editorial py-16">
        <Link to="/assessment" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 mb-12">
          <ArrowLeft size={16} /> Adjust inputs
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-12 gap-12 items-center mb-16">
          <div className="md:col-span-5">
            <span className="badge-sage mb-4">Reading complete</span>
            <h1 className="heading-display text-display-lg text-ink-900 mb-6">
              Tomorrow's<br />
              <em>anxiety probability</em>
            </h1>
          </div>

          <div className="md:col-span-7 flex justify-center">
            <div className="relative">
              <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
                <circle cx="140" cy="140" r={radius} stroke="#e9ebed" strokeWidth="8" fill="transparent" />
                <motion.circle cx="140" cy="140" r={radius} stroke={colors.stroke}
                  strokeWidth="8" fill="transparent" strokeLinecap="round" strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.5, delay: 0.3 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-2">Probability</div>
                <div className="font-display text-7xl text-ink-900 numbered-marker">
                  {pct}<span className="text-3xl text-ink-400">%</span>
                </div>
                <div className={`mt-3 text-xs uppercase tracking-[0.25em] font-semibold ${colors.text}`}>
                  {risk} risk
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-ink-200 mb-16">
          <div className="bg-paper p-8">
            <span className="badge-sage mb-4">Interpretation</span>
            <h3 className="font-display text-xl text-ink-900 mb-4">What this means</h3>
            <p className="text-ink-700">{result.interpretation || 'See risk level for details.'}</p>
          </div>
          <div className={`${colors.bg} p-8`}>
            <span className="badge-amber mb-4">Recommendation</span>
            <h3 className="font-display text-xl text-ink-900 mb-4">Next steps</h3>
            <p className="text-ink-700">{result.recommendation || 'Continue your routine.'}</p>
          </div>
        </div>

        <h2 className="heading-display text-display-md text-ink-900 mb-10">
          Why this reading, <em>broken down</em>.
        </h2>

        <div className="card-elevated">
          <div className="space-y-6">
            {result.top_contributions.slice(0, 8).map((c, i) => {
              const maxAbs = Math.max(...result.top_contributions.map(x => Math.abs(x.contribution)))
              const widthPct = (Math.abs(c.contribution) / maxAbs) * 50
              const isPositive = c.contribution > 0
              return (
                <div key={c.feature} className="grid grid-cols-12 gap-4 items-center pb-4 border-b border-ink-100">
                  <div className="col-span-12 md:col-span-3">
                    <div className="font-mono text-xs text-ink-500">{String(i + 1).padStart(2, '0')}</div>
                    <div className="font-display text-base text-ink-900">{c.feature}</div>
                  </div>
                  <div className="col-span-9 md:col-span-7 relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-ink-300" />
                    <div className="h-8 relative">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.05 }}
                        className={`absolute top-0 bottom-0 ${
                          isPositive ? 'left-1/2 bg-coral-400' : 'right-1/2 bg-sage-500'
                        }`} />
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right">
                    <div className={`inline-flex items-center gap-1 text-sm font-mono ${
                      isPositive ? 'text-coral-700' : 'text-sage-700'
                    }`}>
                      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {c.contribution > 0 ? '+' : ''}{c.contribution.toFixed(3)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-16 p-8 border border-ink-300 bg-paper flex gap-4 items-start">
          <AlertCircle size={20} className="text-ink-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-ink-700">
            <p className="font-display text-base text-ink-900 mb-2">Research-grade insight, not a diagnosis.</p>
            <p>If you are in distress, please contact a mental health professional.</p>
          </div>
        </div>

        <div className="mt-12 flex gap-4">
          <Link to="/assessment" className="btn-secondary">
            <ArrowLeft size={16} /> New assessment
          </Link>
        </div>
      </div>
    </div>
  )
}