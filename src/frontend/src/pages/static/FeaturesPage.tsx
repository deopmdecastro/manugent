import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

const FEATURE_ICONS = [
  'fas fa-brain',
  'fas fa-wrench',
  'fas fa-chart-line',
  'fas fa-qrcode',
  'fas fa-file-pdf',
  'fas fa-mobile-screen',
]

export function FeaturesPage() {
  const { t } = useLanguage()
  const features = t.features.items.map((f, i) => ({ ...f, icon: FEATURE_ICONS[i] }))

  return (
    <StaticPageLayout
      badge={t.features.badge}
      title={
        <>
          {t.features.titleLine1}
          <br />
          {t.features.titleGradient}
        </>
      }
      desc={t.features.desc}
      narrow={false}
    >
      <div className="static-card-grid">
        {features.map(f => (
          <div className="static-card" key={f.title}>
            <div className="static-card-icon"><i className={f.icon} /></div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            {f.highlights && (
              <ul>
                {f.highlights.map(h => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="static-card" style={{ marginTop: '32px', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>{t.featuresPage.ctaTitle}</h2>
        <p>{t.featuresPage.ctaDesc}</p>
        <Link to="/login" className="l-btn l-btn-primary l-btn-lg" style={{ marginTop: '12px' }}>
          {t.featuresPage.ctaButton} <span className="l-btn-arrow">→</span>
        </Link>
      </div>
    </StaticPageLayout>
  )
}
