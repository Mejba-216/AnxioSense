import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { explainPrediction, predictPersonalized } from '../api/predictor'
import { useAuth } from '../api/AuthContext'

// ──────────────────────────────────────────────────────────────────────
// SECTION 1: PHQ-9 (Depression) — 9 questions, scored 0-3 each, total 0-27
// ──────────────────────────────────────────────────────────────────────
const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure',
  'Trouble concentrating on things, such as reading or watching TV',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite — being fidgety or restless',
  'Thoughts that you would be better off dead, or of hurting yourself',
]

// ──────────────────────────────────────────────────────────────────────
// SECTION 2: GAD-7 (Anxiety) — 7 questions, 0-3 each, total 0-21
// ──────────────────────────────────────────────────────────────────────
const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid as if something awful might happen',
]

const FREQUENCY_OPTIONS = [
  { value: 0, label: 'Not at all', sublabel: 'Zero days' },
  { value: 1, label: 'Several days', sublabel: 'A few days' },
  { value: 2, label: 'More than half the days', sublabel: 'Most days' },
  { value: 3, label: 'Nearly every day', sublabel: 'Almost daily' },
]

// ──────────────────────────────────────────────────────────────────────
// SECTION 3: Background — yes/no & simple inputs
// ──────────────────────────────────────────────────────────────────────
const BACKGROUND_QUESTIONS = [
  {
    key: 'suicideHx',
    text: 'Have you ever had thoughts of suicide or self-harm in your lifetime?',
    type: 'yesno',
    hint: 'Lifetime history, not just recently. This information stays private.'
  },
  {
    key: 'CTQ_2',
    text: 'During childhood, did you experience emotional abuse from caregivers?',
    type: 'scale',
    options: [
      { value: 5, label: 'Never' },
      { value: 10, label: 'Rarely' },
      { value: 15, label: 'Sometimes' },
      { value: 20, label: 'Often' },
      { value: 25, label: 'Very often' },
    ],
    hint: 'Childhood Trauma Questionnaire — emotional abuse subscale'
  },
]

// ──────────────────────────────────────────────────────────────────────
// SECTION 4: Today's mood (simple radio choices)
// ──────────────────────────────────────────────────────────────────────
const MOOD_QUESTIONS = [
  {
    key: 'negative',
    text: 'How would you describe your overall mood today?',
    options: [
      { value: -3, label: 'Very bad' },
      { value: -2, label: 'Bad' },
      { value: -1, label: 'A little bad' },
      { value: 0, label: 'Neutral' },
      { value: 1, label: 'A little good' },
      { value: 2, label: 'Good' },
      { value: 3, label: 'Very good' },
    ],
    inverse: true // higher mood value = lower negative score in model
  },
  {
    key: 'negative_E',
    text: 'How is your energy level today?',
    options: [
      { value: -3, label: 'Very low / exhausted' },
      { value: -2, label: 'Low' },
      { value: -1, label: 'Slightly low' },
      { value: 0, label: 'Normal' },
      { value: 1, label: 'Slightly high' },
      { value: 2, label: 'High' },
      { value: 3, label: 'Very high / restless' },
    ]
  },
  {
    key: 'annoying',
    text: 'How irritable have you felt today?',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'A little' },
      { value: 2, label: 'Quite a bit' },
      { value: 3, label: 'Extremely' },
    ]
  },
]

// ──────────────────────────────────────────────────────────────────────
// SECTION 5: Sensor data — friendly inputs
// ──────────────────────────────────────────────────────────────────────
const SENSOR_QUESTIONS = [
  {
    key: 'sleep_duration',
    text: 'How many hours did you sleep last night?',
    type: 'number',
    placeholder: '7',
    min: 0,
    max: 12,
    step: 0.5,
    unit: 'hours',
    hint: 'Total time asleep, not time in bed'
  },
  {
    key: 'sleep_efficiency',
    text: 'How would you rate the quality of your sleep?',
    type: 'options',
    options: [
      { value: 95, label: 'Excellent', sublabel: 'Slept through, deeply' },
      { value: 80, label: 'Good', sublabel: 'Few wake-ups' },
      { value: 65, label: 'Fair', sublabel: 'Some disturbance' },
      { value: 50, label: 'Poor', sublabel: 'Frequent wake-ups' },
      { value: 30, label: 'Very poor', sublabel: 'Barely slept' },
    ]
  },
  {
    key: 'total_steps',
    text: 'How physically active were you yesterday?',
    type: 'options',
    options: [
      { value: 2000, label: 'Very sedentary', sublabel: 'Mostly resting (~2,000 steps)' },
      { value: 5000, label: 'Light activity', sublabel: 'Some walking (~5,000 steps)' },
      { value: 8000, label: 'Moderate', sublabel: 'Active day (~8,000 steps)' },
      { value: 12000, label: 'Very active', sublabel: 'Lots of movement (~12,000+ steps)' },
    ]
  },
  {
    key: 'HR_mean',
    text: 'Do you wear a smartwatch or fitness tracker?',
    type: 'options',
    options: [
      { value: 60, label: 'Yes — resting HR is low (50-65 bpm)', sublabel: 'Athletic baseline' },
      { value: 72, label: 'Yes — resting HR is average (65-80 bpm)', sublabel: 'Typical baseline' },
      { value: 85, label: 'Yes — resting HR is high (80+ bpm)', sublabel: 'Elevated baseline' },
      { value: 72, label: 'No — use typical value', sublabel: 'Average will be used' },
    ]
  },
]

// ──────────────────────────────────────────────────────────────────────
// STEP STRUCTURE
// ──────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'phq9',
    title: 'Depression Screening (PHQ-9)',
    subtitle: 'Over the last 2 weeks, how often have you been bothered by the following?',
    questions: PHQ9_QUESTIONS,
    options: FREQUENCY_OPTIONS,
    aggregateKey: 'PHQ_9',
  },
  {
    id: 'gad7',
    title: 'Anxiety Screening (GAD-7)',
    subtitle: 'Over the last 2 weeks, how often have you been bothered by the following?',
    questions: GAD7_QUESTIONS,
    options: FREQUENCY_OPTIONS,
    aggregateKey: 'GAD_7',
  },
  {
    id: 'background',
    title: 'Background',
    subtitle: 'A few questions about your history',
    questions: BACKGROUND_QUESTIONS,
    custom: true,
  },
  {
    id: 'mood',
    title: 'Today',
    subtitle: 'How you feel right now',
    questions: MOOD_QUESTIONS,
    custom: true,
  },
  {
    id: 'sensors',
    title: 'Body & Sleep',
    subtitle: 'Yesterday and last night',
    questions: SENSOR_QUESTIONS,
    custom: true,
  },
  {
    id: 'review',
    title: 'Review & Submit',
    subtitle: 'Confirm your responses',
  }
]

export default function Assessment() {
  const navigate = useNavigate()
  const [stepIdx, setStepIdx] = useState(0)
  const [answers, setAnswers] = useState({})  // Stores raw answers per question
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const step = STEPS[stepIdx]
  const progress = ((stepIdx + 1) / STEPS.length) * 100

  // ─── Computed scores ───────────────────────────────────────────────
  const computeScore = (stepId) => {
    if (stepId === 'phq9') {
      const vals = PHQ9_QUESTIONS.map((_, i) => answers[`phq9_${i}`] ?? 0)
      return vals.reduce((a, b) => a + b, 0)
    }
    if (stepId === 'gad7') {
      const vals = GAD7_QUESTIONS.map((_, i) => answers[`gad7_${i}`] ?? 0)
      return vals.reduce((a, b) => a + b, 0)
    }
    return null
  }

  const phq9Total = computeScore('phq9')
  const gad7Total = computeScore('gad7')

  // ─── Convert all answers into the model's expected features ────────
  const buildModelInput = () => {
    const input = {
      PHQ_9: phq9Total,
      GAD_7: gad7Total,
      STAI_X2: 40 + (gad7Total * 2),  // approximate from GAD-7
      ...answers,
    }
    // Remove the per-question keys (phq9_0, gad7_0, etc.)
    Object.keys(input).forEach((k) => {
      if (k.startsWith('phq9_') || k.startsWith('gad7_')) delete input[k]
    })
    return input
  }

  const setAnswer = (key, value) => {
    setAnswers((a) => ({ ...a, [key]: value }))
  }

  const isStepComplete = () => {
    if (step.id === 'phq9') {
      return PHQ9_QUESTIONS.every((_, i) => answers[`phq9_${i}`] !== undefined)
    }
    if (step.id === 'gad7') {
      return GAD7_QUESTIONS.every((_, i) => answers[`gad7_${i}`] !== undefined)
    }
    if (step.id === 'background') {
      return BACKGROUND_QUESTIONS.every(q => answers[q.key] !== undefined)
    }
    if (step.id === 'mood') {
      return MOOD_QUESTIONS.every(q => answers[q.key] !== undefined)
    }
    if (step.id === 'sensors') {
      return SENSOR_QUESTIONS.every(q => answers[q.key] !== undefined)
    }
    return true
  }

const handleSubmit = async () => {
  setSubmitting(true)
  setError(null)
  try {
    const inputs = buildModelInput()
    
    // Always get the explanation (SHAP)
    const result = await explainPrediction(inputs)
    
    // If logged in, also get personalized prediction
    let personalized = null
    if (user) {
      try {
        personalized = await predictPersonalized(inputs)
      } catch (e) {
        console.warn('Personalization failed:', e)
      }
    }
    
    sessionStorage.setItem('mira_result', JSON.stringify(result))
    sessionStorage.setItem('mira_personalized', personalized ? JSON.stringify(personalized) : '')
    
    navigate('/results')
  } catch (e) {
    setError(e?.response?.data?.detail || 'Backend not reachable. Is it running on port 8000?')
    setSubmitting(false)
  }
}
  return (
    <div className="bg-cream min-h-screen">
      {/* Progress bar */}
      <div className="sticky top-20 z-40 bg-cream/90 backdrop-blur-md border-b border-ink-200">
        <div className="container-editorial py-4">
          <div className="flex justify-between text-xs uppercase tracking-[0.18em] text-ink-500 mb-3">
            <span className="numbered-marker">
              Step {String(stepIdx + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
            </span>
            <span>{step.title}</span>
          </div>
          <div className="h-px bg-ink-100 relative">
            <motion.div
              className="absolute inset-y-0 left-0 bg-ink-900"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="container-narrow py-16 md:py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-12">
              <span className="badge-sage mb-4">Section {String(stepIdx + 1).padStart(2, '0')}</span>
              <h1 className="heading-display text-display-md text-ink-900 mb-3">{step.title}</h1>
              <p className="text-ink-600 text-lg italic">{step.subtitle}</p>
            </div>

            {/* PHQ-9 / GAD-7 — standardized questionnaire */}
            {(step.id === 'phq9' || step.id === 'gad7') && (
              <div className="space-y-8">
                {step.questions.map((q, i) => {
                  const key = `${step.id}_${i}`
                  return (
                    <div key={key} className="pb-8 border-b border-ink-200 last:border-b-0">
                      <div className="flex items-start gap-4 mb-5">
                        <span className="font-mono text-xs text-ink-400 mt-1 numbered-marker">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="text-ink-900 text-base md:text-lg leading-relaxed flex-1">{q}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-10">
                        {step.options.map((opt) => {
                          const selected = answers[key] === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setAnswer(key, opt.value)}
                              className={`text-left p-3 border transition-all ${
                                selected
                                  ? 'border-ink-900 bg-ink-900 text-cream'
                                  : 'border-ink-200 bg-paper hover:border-ink-500'
                              }`}
                            >
                              <div className={`text-sm font-medium ${selected ? 'text-cream' : 'text-ink-900'}`}>
                                {opt.label}
                              </div>
                              <div className={`text-xs mt-0.5 ${selected ? 'text-cream/70' : 'text-ink-500'}`}>
                                {opt.sublabel}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Running score */}
                {step.id === 'phq9' && (
                  <div className="mt-8 p-6 bg-paper border border-ink-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm uppercase tracking-wider text-ink-500">Running total</span>
                      <span className="font-display text-3xl text-ink-900 numbered-marker">{phq9Total} / 27</span>
                    </div>
                  </div>
                )}
                {step.id === 'gad7' && (
                  <div className="mt-8 p-6 bg-paper border border-ink-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm uppercase tracking-wider text-ink-500">Running total</span>
                      <span className="font-display text-3xl text-ink-900 numbered-marker">{gad7Total} / 21</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Background questions */}
            {step.id === 'background' && (
              <div className="space-y-10">
                {BACKGROUND_QUESTIONS.map((q) => (
                  <div key={q.key} className="pb-8 border-b border-ink-200">
                    <p className="font-display text-xl text-ink-900 mb-2">{q.text}</p>
                    {q.hint && <p className="text-xs text-ink-500 italic mb-5">{q.hint}</p>}
                    {q.type === 'yesno' ? (
                      <div className="grid grid-cols-2 gap-3 max-w-md">
                        {[
                          { value: 1, label: 'Yes' },
                          { value: 0, label: 'No' },
                        ].map(opt => {
                          const selected = answers[q.key] === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setAnswer(q.key, opt.value)}
                              className={`p-4 border transition-all ${
                                selected
                                  ? 'border-ink-900 bg-ink-900 text-cream'
                                  : 'border-ink-200 bg-paper hover:border-ink-500'
                              }`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {q.options.map((opt) => {
                          const selected = answers[q.key] === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setAnswer(q.key, opt.value)}
                              className={`p-3 text-sm border transition-all ${
                                selected
                                  ? 'border-ink-900 bg-ink-900 text-cream'
                                  : 'border-ink-200 bg-paper hover:border-ink-500'
                              }`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Today's mood */}
            {step.id === 'mood' && (
              <div className="space-y-10">
                {MOOD_QUESTIONS.map((q) => (
                  <div key={q.key} className="pb-8 border-b border-ink-200">
                    <p className="font-display text-xl text-ink-900 mb-5">{q.text}</p>
                    <div className={`grid gap-2 ${q.options.length > 4 ? 'grid-cols-2 md:grid-cols-7' : 'grid-cols-2 md:grid-cols-4'}`}>
                      {q.options.map((opt) => {
                        const selected = answers[q.key] === opt.value
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setAnswer(q.key, opt.value)}
                            className={`p-3 text-sm border transition-all ${
                              selected
                                ? 'border-ink-900 bg-ink-900 text-cream'
                                : 'border-ink-200 bg-paper hover:border-ink-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sensors */}
            {step.id === 'sensors' && (
              <div className="space-y-10">
                {SENSOR_QUESTIONS.map((q) => (
                  <div key={q.key} className="pb-8 border-b border-ink-200">
                    <p className="font-display text-xl text-ink-900 mb-2">{q.text}</p>
                    {q.hint && <p className="text-xs text-ink-500 italic mb-5">{q.hint}</p>}
                    {q.type === 'number' ? (
                      <div className="flex items-center gap-4 max-w-xs">
                        <input
                          type="number"
                          min={q.min}
                          max={q.max}
                          step={q.step}
                          placeholder={q.placeholder}
                          value={answers[q.key] ?? ''}
                          onChange={(e) => setAnswer(q.key, parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border border-ink-300 bg-cream focus:border-ink-900 focus:outline-none font-display text-2xl text-ink-900 numbered-marker"
                        />
                        <span className="text-sm text-ink-500 uppercase tracking-wider">{q.unit}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {q.options.map((opt, idx) => {
                          const selected = answers[q.key] === opt.value
                          return (
                            <button
                              key={idx}
                              onClick={() => setAnswer(q.key, opt.value)}
                              className={`w-full text-left p-4 border transition-all flex items-center justify-between ${
                                selected
                                  ? 'border-ink-900 bg-ink-900 text-cream'
                                  : 'border-ink-200 bg-paper hover:border-ink-500'
                              }`}
                            >
                              <div>
                                <div className={`font-medium ${selected ? 'text-cream' : 'text-ink-900'}`}>
                                  {opt.label}
                                </div>
                                {opt.sublabel && (
                                  <div className={`text-xs mt-0.5 ${selected ? 'text-cream/70' : 'text-ink-500'}`}>
                                    {opt.sublabel}
                                  </div>
                                )}
                              </div>
                              {selected && <Check size={18} className="text-cream" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Review */}
            {step.id === 'review' && (
              <div className="space-y-6">
                <div className="card-elevated">
                  <h3 className="font-display text-xl text-ink-900 mb-6">Your scores</h3>
                  <div className="grid grid-cols-2 gap-px bg-ink-200">
                    <div className="bg-cream p-6">
                      <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">PHQ-9 Total</div>
                      <div className="font-display text-4xl text-ink-900 numbered-marker">{phq9Total}<span className="text-lg text-ink-400">/27</span></div>
                      <div className="text-xs text-ink-500 mt-2 italic">
                        {phq9Total < 5 ? 'Minimal' : phq9Total < 10 ? 'Mild' : phq9Total < 15 ? 'Moderate' : phq9Total < 20 ? 'Moderately severe' : 'Severe'}
                      </div>
                    </div>
                    <div className="bg-cream p-6">
                      <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">GAD-7 Total</div>
                      <div className="font-display text-4xl text-ink-900 numbered-marker">{gad7Total}<span className="text-lg text-ink-400">/21</span></div>
                      <div className="text-xs text-ink-500 mt-2 italic">
                        {gad7Total < 5 ? 'Minimal' : gad7Total < 10 ? 'Mild' : gad7Total < 15 ? 'Moderate' : 'Severe'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-6">
                  <p className="text-sm text-amber-900 leading-relaxed">
                    These are screening scores, not diagnoses. Below, the model
                    will combine them with your mood and sensor data to estimate
                    tomorrow's anxiety risk.
                  </p>
                </div>

                {error && (
                  <div className="bg-coral-50 border border-coral-200 p-6">
                    <p className="text-sm text-coral-900">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-16 pt-8 border-t border-ink-200">
              <button
                onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                disabled={stepIdx === 0}
                className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} /> Previous
              </button>

              {stepIdx < STEPS.length - 1 ? (
                <button
                  onClick={() => setStepIdx((s) => s + 1)}
                  disabled={!isStepComplete()}
                  className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Computing…</>
                  ) : (
                    <>Submit & predict <ArrowRight size={16} /></>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}