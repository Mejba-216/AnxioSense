import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../api/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const redirectTo = location.state?.from || '/assessment'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(redirectTo)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Login failed. Check your credentials.')
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
            <span className="badge-sage mb-4">Welcome back</span>
            <h1 className="heading-display text-display-md text-ink-900 mb-3">
              Sign in to <em>Mira</em>
            </h1>
            <p className="text-ink-600">
              Continue tracking your patterns
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
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
                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
              )}
            </button>

            <div className="text-center pt-4 border-t border-ink-200">
              <p className="text-sm text-ink-600">
                Don't have an account?{' '}
                <Link to="/register" className="link-editorial">
                  Create one
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}