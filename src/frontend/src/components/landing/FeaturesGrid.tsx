const FEATURES = [
  {
    icon: 'fas fa-brain',
    title: 'Agente IA Inteligente',
    desc: 'Diagnóstico e recomendações em tempo real com GPT-4o e Llama 3. O teu especialista de manutenção sempre disponível, 24/7.',
  },
  {
    icon: 'fas fa-wrench',
    title: 'Ordens de Serviço Inteligentes',
    desc: 'Criação automática de OTs corretivas com base em medições. Tracking de tempo, notificações e mudanças de estado em tempo real.',
  },
  {
    icon: 'fas fa-chart-line',
    title: 'KPIs em Tempo Real',
    desc: 'MTBF, MTTR, OEE e compliance num dashboard vivo. Toma decisões com dados, não com feeling.',
  },
  {
    icon: 'fas fa-qrcode',
    title: 'NFC & QR Codes',
    desc: 'Scan instantâneo de equipamentos com o telemóvel. Histórico completo, manuais e checklists em segundos.',
  },
  {
    icon: 'fas fa-file-pdf',
    title: 'Relatórios Automáticos',
    desc: 'Geração de PDFs profissionais com um clique. Relatórios de intervenção prontos para cliente e auditoria.',
  },
  {
    icon: 'fas fa-mobile-screen',
    title: 'Mobile & Offline',
    desc: 'PWA completa. Funciona sem rede — sincroniza automaticamente quando voltas online. Tablet e smartphone.',
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="l-section">
      <div className="l-section-header">
        <span className="l-section-badge">Plataforma</span>
        <h2 className="l-section-title">
          Tudo o que precisas para
          <br />
          <span className="l-hero-title-gradient">gerir manutenção industrial</span>
        </h2>
        <p className="l-section-desc">
          Do diagnóstico à execução, uma plataforma que cobre o ciclo completo
          de manutenção — com IA integrada em cada passo.
        </p>
      </div>

      <div className="l-features-grid">
        {FEATURES.map((f, i) => (
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
