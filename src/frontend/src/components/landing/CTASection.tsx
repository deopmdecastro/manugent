export function CTASection() {
  return (
    <section className="l-section l-cta">
      <div className="l-cta-card l-reveal">
        <div className="l-cta-glow" />
        <h2 className="l-cta-title">
          Pronto para transformar
          <br />
          <span className="l-hero-title-gradient">a tua manutenção?</span>
        </h2>
        <p className="l-cta-desc">
          Começa hoje com o plano gratuito. Sem cartão de crédito.
          Sem compromisso. IA real incluída.
        </p>
        <div className="l-cta-actions">
          <a href="#login" className="l-btn l-btn-primary l-btn-lg">
            Criar conta gratuita <span className="l-btn-arrow">→</span>
          </a>
          <a href="#login" className="l-btn l-btn-outline l-btn-lg">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="2" width="16" height="14" rx="3" />
              <path d="M1 6l8 5.5L17 6" />
            </svg>
            Agendar demo
          </a>
        </div>
      </div>
    </section>
  )
}
