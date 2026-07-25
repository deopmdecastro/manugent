import { useLanguage } from '../../contexts/LanguageContext'

const FEATURE_ICONS = [
  'fas fa-brain',
  'fas fa-wrench',
  'fas fa-chart-line',
  'fas fa-qrcode',
  'fas fa-file-pdf',
  'fas fa-mobile-screen',
]

export function FeaturesGrid() {
  const { t } = useLanguage()
  const features = t.features.items.map((f, i) => ({ ...f, icon: FEATURE_ICONS[i] }))

  return (
    <section id="features" className="l-section">
      <div className="l-section-header l-reveal">
        <span className="l-section-badge">{t.features.badge}</span>
        <h2 className="l-section-title">
          {t.features.titleLine1}
          <br />
          <span className="l-hero-title-gradient">{t.features.titleGradient}</span>
        </h2>
        <p className="l-section-desc">
          {t.features.desc}
        </p>
      </div>

      <div className="l-features-grid l-reveal l-reveal-delay-1">
        {features.map((f, i) => (
          <div key={i} className="l-feature-card">
            <div className="l-feature-card-icon">
              <i className={f.icon} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
