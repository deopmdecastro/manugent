import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Módulos', href: '#modules' },
  { label: 'IA', href: '#ai' },
  { label: 'Preços', href: '#pricing' },
  { label: 'Recursos', href: '#resources' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { document.body.style.overflow = mobileOpen ? 'hidden' : '' }, [mobileOpen])

  return (
    <nav className={`l-nav${scrolled ? ' is-scrolled' : ''}`}>
      <div className="l-nav-inner">
        <a href="#top" className="l-nav-logo" aria-label="ManuGent">
          <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" height="28" />
        </a>

        <div className={`l-nav-links${mobileOpen ? ' is-open' : ''}`}>
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} className="l-nav-link" onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="l-nav-actions">
          <a href="#login" className="l-nav-login">Entrar</a>
          <a href="#login" className="l-btn l-btn-primary l-btn-sm">
            Começar grátis
          </a>
        </div>

        <button
          className={`l-nav-burger${mobileOpen ? ' is-open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && <div className="l-nav-overlay" onClick={() => setMobileOpen(false)} />}
    </nav>
  )
}
