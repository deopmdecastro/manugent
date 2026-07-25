import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

export function CTASection() {
  const { t } = useLanguage()

  return (
    <section className="l-section l-cta">
      <div className="l-cta-card l-reveal">
        <div className="l-cta-glow" />
        <h2 className="l-cta-title">
          {t.cta.titleLine1}
          <br />
          <span className="l-hero-title-gradient">{t.cta.titleGradient}</span>
        </h2>
        <p className="l-cta-desc">
          {t.cta.desc}
        </p>
        <div className="l-cta-actions">
          <Link to="/login" className="l-btn l-btn-primary l-btn-lg">
            {t.cta.primary} <span className="l-btn-arrow">→</span>
          </Link>
          <Link to="/login" className="l-btn l-btn-outline l-btn-lg">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="2" width="16" height="14" rx="3" />
              <path d="M1 6l8 5.5L17 6" />
            </svg>
            {t.cta.secondary}
          </Link>
        </div>
      </div>
    </section>
  )
}
