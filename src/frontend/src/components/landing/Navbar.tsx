import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '/landing#features' },
  { label: 'Módulos', href: '/landing#modules' },
  { label: 'IA', href: '/landing#ai' },
  { label: 'Preços', href: '/landing#pricing' },
]

const RESOURCES_DROPDOWN = [
  { label: 'Documentação', desc: 'Guias e referência da API', href: '#' },
  { label: 'Blog', desc: 'Novidades e boas práticas', href: '#' },
  { label: 'Casos de sucesso', desc: 'Histórias de clientes', href: '#' },
  { label: 'Central de ajuda', desc: 'Suporte e FAQs', href: '#' },
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
        <Link to="/landing" className="l-nav-logo" aria-label="ManuGent">
          <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" height="38" />
        </Link>

        <div className={`l-nav-links${mobileOpen ? ' is-open' : ''}`}>
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} className="l-nav-link" onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}

          <div className="l-nav-dropdown">
            <button type="button" className="l-nav-link l-nav-link-dropdown">
              Recursos
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 3.5L5 6.5L8 3.5" />
              </svg>
            </button>
            <div className="l-nav-dropdown-panel">
              {RESOURCES_DROPDOWN.map(item => (
                <a key={item.label} href={item.href} className="l-nav-dropdown-item" onClick={() => setMobileOpen(false)}>
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="l-nav-actions">
          <Link to="/login" className="l-nav-login">Entrar</Link>
          <Link to="/login" className="l-btn l-btn-primary l-btn-sm">
            Começar grátis
          </Link>
        </div>

        <button
          className={`l-nav-burger${mobileOpen ? ' is-open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {mobileOpen && <div className="l-nav-overlay" onClick={() => setMobileOpen(false)} />}
    </nav>
  )
}
