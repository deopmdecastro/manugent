import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { StaticPageLayout } from '../components/static/StaticPageLayout'

export function PricingPage() {
  const { t } = useLanguage()
  const page = t.pricingPage
  const [annual, setAnnual] = useState(true)

  return (
    <StaticPageLayout badge={page.badge} title={<>{page.titleLine1}<br /><span className="l-hero-title-gradient">{page.titleGradient}</span></>} desc={page.desc} narrow={false}>
      <div className="pricing-toggle" role="group" aria-label={page.billingMonthly}>
        <button type="button" className={`pricing-toggle-btn${!annual ? ' is-active' : ''}`} onClick={() => setAnnual(false)}>
          {page.billingMonthly}
        </button>
        <button type="button" className={`pricing-toggle-btn${annual ? ' is-active' : ''}`} onClick={() => setAnnual(true)}>
          {page.billingAnnual}
          <span className="pricing-toggle-badge">{page.billingAnnualBadge}</span>
        </button>
      </div>

      <div className="pricing-grid">
        {page.plans.map(plan => {
          const price = annual ? plan.priceAnnual : plan.priceMonthly
          const isNumeric = /^[\d$€]/.test(price)
          return (
            <div className={`static-card pricing-card${plan.popular ? ' is-popular' : ''}`} key={plan.name}>
              {plan.popular && <span className="pricing-popular-badge">{page.popularLabel}</span>}
              <h3 className="pricing-plan-name">{plan.name}</h3>
              <p className="pricing-plan-tagline">{plan.tagline}</p>
              <div className="pricing-plan-price">
                <strong>{price}</strong>
                {isNumeric && price !== '0€' && price !== '$0' && (
                  <span>{page.perUser}{page.perMonth}</span>
                )}
              </div>
              <Link to={plan.ctaHref} className={`l-btn ${plan.popular ? 'l-btn-primary' : 'l-btn-ghost'} pricing-plan-cta`}>
                {plan.cta}
              </Link>
              <ul className="pricing-plan-features">
                {plan.features.map(f => (
                  <li key={f}><i className="fas fa-check" />{f}</li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="pricing-faq">
        <h2>{page.faqTitle}</h2>
        <div className="pricing-faq-grid">
          {page.faq.map(item => (
            <div className="static-card pricing-faq-item" key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="static-card" style={{ marginTop: 32, textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>{page.ctaTitle}</h2>
        <p>{page.ctaDesc}</p>
        <Link to="/contacto" className="l-btn l-btn-primary l-btn-lg" style={{ marginTop: 12 }}>
          {page.ctaButton} <span className="l-btn-arrow">→</span>
        </Link>
      </div>
    </StaticPageLayout>
  )
}
