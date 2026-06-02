import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Sparkles, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../api/AuthContext'

export default function Results() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [result, setResult] = useState(null)
  const [personalized, setPersonalized] = useState(null)
  const [viewMode, setViewMode] = useState('standard')

  useEffect(() => {
    const stored = sessionStorage.getItem('mira_result')
    if (!stored) {
      navigate('/assessment')
      return
    }
    setResult(JSON.parse(stored))
    
    const pers = sessionStorage.getItem('mira_personalized')
    if (pers && pers !== '') {
      try {
        const persData = JSON.parse(pers)
        if (persData.personalization_available) {
          setPersonalized(persData)
        }
      } catch (e) {
        console.warn('Could not parse personalized data')
      }
    }
  }, [navigate])

  if (!result) return null

  const displayProb = (viewMode === 'personalized' && personalized)
    ? personalized.personalized_probability
    : result.probability
  
  const pct = Math.round(displayProb * 100)
  const risk = displayProb >= 0.7 ? 'HIGH' : displayProb >= 0.4 ? 'MODERATE' : 'LOW'
  
  const colors = {
    HIGH: { stroke: '#d4422a', text: 'text-coral-700', bg: 'bg-coral-50' },
    MODERATE: { stroke: '#d6841d', text: 'text-amber-700', bg: 'bg-amber-50' },
    LOW: { stroke: '#5a8865', text: 'text-sage-700', bg: 'bg-sage-50' },
  }[risk]

  const radius = 100
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - displayProb)

  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="container-editorial py-16">
        <Link to="/assessment" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 mb-12">
          <ArrowLeft size={16} /> Adjust inputs
        </Link>

        {/* Mode toggle */}
        {personalized && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 inline-flex border border-ink-300 bg-paper p-1"
          >
            <button
              onClick={() => setViewMode('standard')}
              className={`px-5 py-2 text-sm transition-all ${
                viewMode === 'standard' ? 'bg-ink-900 text-cream' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setViewMode('personalized')}
              className={`px-5 py-2 text-sm transition-all inline-flex items-center gap-2 ${
                viewMode === 'personalized' ? 'bg-ink-900 text-cream' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Sparkles size={14} />
              Personalized
            </button>
          </motion.div>
        )}

        {/* Hero with gauge */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-12 gap-12 items-center mb-16"
        >
          <div className="md:col-span-5">
            <span className={`badge-${risk === 'HIGH' ? 'coral' : risk === 'MODERATE' ? 'amber' : 'sage'} mb-4`}>
              {viewMode === 'personalized' ? 'Personalized reading' : 'Standard reading'}
            </span>
            <h1 className="heading-display text-display-lg text-ink-900 mb-6">
              Tomorrow's<br />
              <em>anxiety probability</em>
            </h1>
            {viewMode === 'personalized' && personalized?.interpretation && (
              <p className="text-sm text-ink-600 italic leading-relaxed mt-4">
                {personalized.interpretation}
              </p>
            )}
          </div>

          <div className="md:col-span-7 flex justify-center">
            <div className="relative">
              <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
                <circle cx="140" cy="140" r={radius} stroke="#e9ebed" strokeWidth="8" fill="transparent" />
                <motion.circle
                  cx="140" cy="140" r={radius}
                  stroke={colors.stroke}
                  strokeWidth="8" fill="transparent" strokeLinecap="round"
                  strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
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

        {/* Comparison panel */}
        {personalized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-16 card-elevated"
          >
            <div className="flex items-start gap-4 mb-6">
              <Sparkles className="text-ink-700 flex-shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="font-display text-2xl text-ink-900 mb-2">
                  Comparing your readings
                </h3>
                <p className="text-sm text-ink-600 italic">
                  Personalization uses Patient-Similarity weighted Calibration (PS-Cal)
                  from our research. Based on {personalized.similar_patients_count} most
                  similar patients in our database.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-px bg-ink-200">
              <div className="bg-paper p-8">
                <div className="text-xs uppercase tracking-[0.15em] text-ink-500 mb-3">
                  Standard Prediction
                </div>
                <div className="font-display text-5xl text-ink-900 numbered-marker mb-2">
                  {Math.round(result.probability * 100)}%
                </div>
                <div className="text-xs text-ink-500">
                  Global model, all 43 patients
                </div>
              </div>
              <div className="bg-paper p-8">
                <div className="text-xs uppercase tracking-[0.15em] text-sage-700 mb-3">
                  Personalized Prediction
                </div>
                <div className="font-display text-5xl text-sage-700 numbered-marker mb-2">
                  {Math.round(personalized.personalized_probability * 100)}%
                </div>
                <div className="text-xs text-ink-500">
                  Profile-similarity weighted
                </div>
              </div>
            </div>

<div className="mt-6 pt-6 border-t border-ink-200 flex flex-wrap gap-x-10 gap-y-4 text-sm">
  <div>
    <span className="text-ink-500">Adjustment applied: </span>
    <span className="font-mono text-ink-900">
      {personalized.adjustment > 0 ? '+' : ''}{Math.round(personalized.adjustment * 100)}%
    </span>
  </div>
  <div>
    <span className="text-ink-500">Reference patients: </span>
    <span className="font-mono text-ink-900">
      {personalized.similar_patients_count} of 43
    </span>
  </div>
  <div>
    <span className="text-ink-500">Effect on prediction: </span>
    <span className={`font-mono ${personalized.meaningful_adjustment ? 'text-sage-700' : 'text-ink-500'}`}>
      {personalized.meaningful_adjustment ? 'Meaningful' : 'Minimal'}
    </span>
  </div>
</div>

            {!personalized.meaningful_adjustment && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 flex gap-3 items-start text-sm">
                <Info size={16} className="text-amber-700 mt-0.5 flex-shrink-0" />
                <p className="text-amber-900">
                  Personalization provides minimal adjustment for your profile.
                  This is the honest finding from our research: PS-Cal helps approximately 30%
                  of patients meaningfully. For your profile, the standard prediction is the
                  more reliable estimate.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Hint for non-logged-in users */}
        {!personalized && !user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-16 p-6 border border-ink-300 bg-paper flex items-start gap-4"
          >
            <Sparkles size={20} className="text-ink-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-display text-lg text-ink-900 mb-2">
                Get personalized predictions
              </p>
              <p className="text-sm text-ink-700 leading-relaxed mb-4">
                Logged-in users receive both standard and personalized readings,
                calibrated to similar patients using our PS-Cal framework.
              </p>
              <Link to="/register" className="link-editorial text-sm">
                Create a free account →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Interpretation cards */}
        <div className="grid md:grid-cols-2 gap-px bg-ink-200 mb-16">
          <div className="bg-paper p-8">
            <span className="badge-sage mb-4">Interpretation</span>
            <h3 className="font-display text-xl text-ink-900 mb-4">What this means</h3>
            <p className="text-ink-700">{result.interpretation}</p>
          </div>
          <div className={`${colors.bg} p-8`}>
            <span className="badge-amber mb-4">Recommendation</span>
            <h3 className="font-display text-xl text-ink-900 mb-4">Next steps</h3>
            <p className="text-ink-700">{result.recommendation}</p>
          </div>
        </div>

        {/* SHAP breakdown */}
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
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.05 }}
                        className={`absolute top-0 bottom-0 ${
                          isPositive ? 'left-1/2 bg-coral-400' : 'right-1/2 bg-sage-500'
                        }`}
                      />
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
            <p className="font-display text-base text-ink-900 mb-2">
              Research-grade insight, not a diagnosis.
            </p>
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