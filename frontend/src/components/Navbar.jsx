import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const links = [
  { to: '/assessment', label: 'Assessment' },
  { to: '/about', label: 'About' },
  { to: '/methodology', label: 'Methodology' },
  { to: '/privacy', label: 'Privacy' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [location])

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-cream/85 backdrop-blur-md border-b border-ink-200' : 'bg-transparent'
    }`}>
      <div className="container-editorial">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-ink-900 flex items-center justify-center">
              <span className="font-display text-cream text-lg italic">m</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg tracking-tight text-ink-900">Mira</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500 mt-0.5">
                anxiety insights
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            {links.map((link) => {
              const active = location.pathname === link.to
              return (
                <Link key={link.to} to={link.to}
                  className={`text-sm font-medium transition-colors relative ${
                    active ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
                  }`}>
                  {link.label}
                  {active && <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-ink-900" />}
                </Link>
              )
            })}
            <Link to="/assessment" className="btn-primary text-xs">Begin</Link>
          </nav>

          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-6 border-t border-ink-200 mt-0 pt-4">
            <nav className="flex flex-col gap-4">
              {links.map((link) => (
                <Link key={link.to} to={link.to} className="text-base font-medium text-ink-900 py-2">
                  {link.label}
                </Link>
              ))}
              <Link to="/assessment" className="btn-primary text-xs justify-center mt-2">
                Begin Assessment
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}