export function Hero() {
  return (
    <section className="l-hero">
      <div className="l-hero-grid">
        {/* Left */}
        <div className="l-hero-content">
          <div className="l-hero-badge">
            <span className="l-hero-badge-dot" />
            AI-Powered Maintenance Operating System
          </div>

          <h1 className="l-hero-title">
            O conhecimento técnico,
            <br />
            <span className="l-hero-title-gradient">transformado em IA.</span>
          </h1>

          <p className="l-hero-desc">
            ManuGent é o agente inteligente de manutenção industrial — CMMS, base de
            conhecimento e técnico sénior digital, tudo numa plataforma que aprende
            com a sua equipa.
          </p>

          <div className="l-hero-actions">
            <a href="#login" className="l-btn l-btn-primary l-btn-lg">
              Começar gratuitamente <span className="l-btn-arrow">→</span>
            </a>
            <a href="#features" className="l-btn l-btn-ghost">
              Ver funcionalidades
            </a>
          </div>

          <div className="l-hero-perks">
            <div className="l-hero-perk">
              <div className="l-hero-perk-icon"><i className="fas fa-shield-check" /></div>
              <div>
                <strong>Seguro e confiável</strong>
                <span>Dados protegidos</span>
              </div>
            </div>
            <div className="l-hero-perk">
              <div className="l-hero-perk-icon"><i className="fas fa-bolt" /></div>
              <div>
                <strong>Implementação rápida</strong>
                <span>Em poucos dias</span>
              </div>
            </div>
            <div className="l-hero-perk">
              <div className="l-hero-perk-icon"><i className="fas fa-users" /></div>
              <div>
                <strong>Feito para equipas</strong>
                <span>Colaboração inteligente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Hero Visual */}
        <div className="l-hero-visual">
          <HeroVisualCanvas />
        </div>
      </div>
    </section>
  )
}

function HeroVisualCanvas() {
  return (
    <div className="l-hero-scene">
      {/* Background glows */}
      <div className="l-hero-glow l-hero-glow-1" />
      <div className="l-hero-glow l-hero-glow-2" />
      <div className="l-hero-glow l-hero-glow-3" />

      {/* Pedestal */}
      <div className="l-hero-pedestal">
        <div className="l-hero-pedestal-ring" />
        <div className="l-hero-pedestal-base" />
      </div>

      {/* Robot */}
      <div className="l-hero-robot">
        <img
          src="/app/assets/3d_mascot.png"
          alt="ManuGent AI Robot"
          className="l-hero-robot-img"
        />
      </div>

      {/* Floating Cards */}
      <FloatingCard
        className="l-float-1"
        label="Ordens de Serviço"
        value="128"
        sub="Abertas"
        icon="fas fa-wrench"
        color="#818cf8"
      />
      <FloatingCard
        className="l-float-2"
        label="Manutenções"
        value="96%"
        sub="Concluídas"
        icon="fas fa-check-circle"
        color="#34d399"
      />
      <FloatingCard
        className="l-float-3"
        label="Ativos"
        value="342"
        sub="Total"
        icon="fas fa-microchip"
        color="#fbbf24"
      />
      <FloatingCard
        className="l-float-4"
        label="IA Insights"
        value="24"
        sub="Recomendações"
        icon="fas fa-brain"
        color="#c084fc"
      />
      <FloatingCard
        className="l-float-5"
        label="Economia"
        value="23%"
        sub="Redução de custos"
        icon="fas fa-chart-line"
        color="#38bdf8"
      />
      <FloatingCard
        className="l-float-6"
        label="Inventário"
        value="1.284"
        sub="Itens"
        icon="fas fa-boxes"
        color="#fb923c"
      />

      {/* Connecting lines (CSS) */}
    </div>
  )
}

function FloatingCard({ className, label, value, sub, icon, color }: {
  className: string
  label: string; value: string; sub: string
  icon: string; color: string
}) {
  return (
    <div className={`l-float-card ${className}`}>
      <div className="l-float-card-inner">
        <div className="l-float-card-icon" style={{ color }}>
          <i className={icon} />
        </div>
        <div className="l-float-card-data">
          <span className="l-float-card-value">{value}</span>
          <span className="l-float-card-sub">{sub}</span>
        </div>
      </div>
    </div>
  )
}
