import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { language, toggleLanguage, t } = useLanguage()
  const NAV_LINKS = t.nav.links
  const RESOURCES_DROPDOWN = t.nav.resources

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
          <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" height="48" />
        </Link>

        <div className={`l-nav-links${mobileOpen ? ' is-open' : ''}`}>
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} className="l-nav-link" onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}

          <div className="l-nav-dropdown">
            <button type="button" className="l-nav-link l-nav-link-dropdown">
              {t.nav.resourcesLabel}
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
          <button
            type="button"
            className="l-nav-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t.nav.themeToLight : t.nav.themeToDark}
            title={theme === 'dark' ? t.nav.themeToLight : t.nav.themeToDark}
          >
            {theme === 'dark' ? (
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="4" />
                <path d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.9 4.1l-1.4 1.4M5.5 14.5l-1.4 1.4M15.9 15.9l-1.4-1.4M5.5 5.5 4.1 4.1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.5 11.6A7.6 7.6 0 0 1 8.4 2.5a.6.6 0 0 0-.8-.7 8.6 8.6 0 1 0 10.6 10.6.6.6 0 0 0-.7-.8z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="l-nav-lang-btn"
            onClick={toggleLanguage}
            aria-label={t.nav.languageLabel}
            title={t.nav.languageLabel}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="10" cy="10" r="8" />
              <path d="M2 10h16M10 2c2.2 2.2 3.4 5 3.4 8s-1.2 5.8-3.4 8c-2.2-2.2-3.4-5-3.4-8S7.8 4.2 10 2z" />
            </svg>
            {language.toUpperCase()}
          </button>

          <Link to="/login" className="l-nav-login">{t.nav.login}</Link>
          <Link to="/login" className="l-btn l-btn-primary l-btn-sm">
            {t.nav.cta}
          </Link>
        </div>

        <button
          className={`l-nav-burger${mobileOpen ? ' is-open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={t.nav.menuLabel}
        >
          <span /><span /><span />
        </button>
      </div>

      {mobileOpen && <div className="l-nav-overlay" onClick={() => setMobileOpen(false)} />}
    </nav>
  )
}
