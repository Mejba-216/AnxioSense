import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../api/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await register(email, password, name)
      navigate('/assessment')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="bg-cream min-h-[80vh] flex items-center">
      <div className="container-narrow py-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-12 text-center">
            <span className="badge-sage mb-4">Create an account</span>
            <h1 className="heading-display text-display-md text-ink-900 mb-3">
              Begin your <em>journey</em>
            </h1>
            <p className="text-ink-600">
              Track your anxiety patterns over time
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-ink-500 mb-2">
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-ink-300 bg-cream focus:border-ink-900 focus:outline-none font-body text-ink-900"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-ink-500 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-ink-300 bg-cream focus:border-ink-900 focus:outline-none font-body text-ink-900"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-ink-500 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 border border-ink-300 bg-cream focus:border-ink-900 focus:outline-none font-body text-ink-900"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-ink-500 mb-2">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-ink-300 bg-cream focus:border-ink-900 focus:outline-none font-body text-ink-900"
              />
            </div>

            {error && (
              <div className="bg-coral-50 border border-coral-200 p-4">
                <p className="text-sm text-coral-900">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center group disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account…</>
              ) : (
                <>Create account <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
              )}
            </button>

            <div className="text-center pt-4 border-t border-ink-200">
              <p className="text-sm text-ink-600">
                Already have an account?{' '}
                <Link to="/login" className="link-editorial">
                  Sign in
                </Link>
              </p>
            </div>

            <p className="text-xs text-ink-500 text-center italic leading-relaxed">
              Your data is stored securely. We do not share it with anyone.
              See our <Link to="/privacy" className="underline">privacy policy</Link>.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}