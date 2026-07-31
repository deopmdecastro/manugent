import { useLanguage } from '../../contexts/LanguageContext'

export function Testimonials() {
  const { t } = useLanguage()

  return (
    <section id="testimonials" className="l-section">
      <div className="l-section-header l-reveal">
        <span className="l-section-badge">{t.testimonials.badge}</span>
        <h2 className="l-section-title">
          {t.testimonials.titleLine1}
          <br />
          <span className="l-hero-title-gradient">{t.testimonials.titleGradient}</span>
        </h2>
        <p className="l-section-desc">{t.testimonials.desc}</p>
      </div>

      <div className="l-testimonials-grid l-reveal l-reveal-delay-1">
        {t.testimonials.items.map((item, i) => (
          <figure key={i} className="l-testimonial-card">
            <div className="l-testimonial-stars" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, star) => (
                <i key={star} className="fas fa-star" />
              ))}
            </div>
            <blockquote className="l-testimonial-quote">&ldquo;{item.quote}&rdquo;</blockquote>
            <figcaption className="l-testimonial-author">
              <span className="l-testimonial-avatar" aria-hidden="true">
                {item.name.charAt(0)}
              </span>
              <span className="l-testimonial-author-info">
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
