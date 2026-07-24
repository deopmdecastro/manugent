export function CTASection() {
  return (
    <section className="l-section l-cta">
      <div className="l-cta-card">
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
          <a href="#login" className="l-btn l-btn-outline">
            Agendar demo
          </a>
        </div>
      </div>
    </section>
  )
}
