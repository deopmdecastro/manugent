export function Hero() {
  return (
    <section className="l-hero">
      <div className="l-hero-grid">
        {/* ── LEFT COLUMN ── */}
        <div className="l-hero-content l-reveal">
          {/* Badge */}
          <div className="l-hero-badge">
            <span className="l-hero-badge-dot" />
            AI-POWERED MAINTENANCE OPERATING SYSTEM
          </div>

          {/* Title */}
          <h1 className="l-hero-title">
            O conhecimento técnico,
            <br />
            <span className="l-hero-title-gradient">transformado em IA.</span>
          </h1>

          {/* Description */}
          <p className="l-hero-desc">
            ManuGent é o agente inteligente de manutenção industrial: CMMS, base de
            conhecimento e técnico sénior digital — tudo numa plataforma que aprende
            com a sua equipa.
          </p>

          {/* CTAs */}
          <div className="l-hero-actions">
            <a href="#login" className="l-btn l-btn-primary l-btn-lg">
              Começar grátis <span className="l-btn-arrow">→</span>
            </a>
            <a href="#features" className="l-btn l-btn-ghost">
              Ver funcionalidades
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
                <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
              </svg>
            </a>
          </div>

          {/* Perks */}
          <div className="l-hero-perks">
            <div className="l-hero-perk">
              <div className="l-hero-perk-icon l-hero-perk-icon-outline">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1L3 3v4c0 3.5 2 6.5 5 8 3-1.5 5-4.5 5-8V3L8 1z"/></svg>
              </div>
              <div>
                <strong>Seguro e confiável</strong>
                <span>Dados protegidos</span>
              </div>
            </div>
            <div className="l-hero-perk">
              <div className="l-hero-perk-icon l-hero-perk-icon-outline">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 4L5.5 11.5 3 9"/></svg>
              </div>
              <div>
                <strong>Implementação rápida</strong>
                <span>Em poucos dias</span>
              </div>
            </div>
            <div className="l-hero-perk">
              <div className="l-hero-perk-icon l-hero-perk-icon-outline">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="2"/><circle cx="11" cy="5" r="2"/><path d="M3 13l3-3 2 2 4-4"/></svg>
              </div>
              <div>
                <strong>Feito para equipas</strong>
                <span>Colaboração inteligente</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Hero Visual ── */}
        <div className="l-hero-visual l-reveal l-reveal-delay-1">
          <HeroVisual />
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   HERO VISUAL — Robot + Floating Cards + Connecting Lines
   ═══════════════════════════════════════════════════════════════════ */
function HeroVisual() {
  return (
    <div className="l-hero-scene">
      {/* Background glows */}
      <div className="l-hero-glow l-hero-glow-1" />
      <div className="l-hero-glow l-hero-glow-2" />
      <div className="l-hero-glow l-hero-glow-3" />

      {/* Pedestal glow — a large ellipse under the robot */}
      <div className="l-hero-pedestal" />

      {/* Robot */}
      <div className="l-hero-robot">
        <img src="/app/assets/3d_mascot.png" alt="ManuGent AI Robot" />
      </div>

      {/* ── Floating Cards ── */}
      <FloatingCard
        pos="top-left"
        label="Ordens de Serviço"
        value="128"
        sub="Abertas"
        color="#818cf8"
      />
      <FloatingCard
        pos="top-right"
        label="Manutenções"
        value="96%"
        sub="Concluídas"
        color="#34d399"
      />
      <FloatingCard
        pos="mid-left"
        label="Ativos"
        value="342"
        sub="Total"
        color="#fbbf24"
      />
      <FloatingCard
        pos="mid-right"
        label="Economia"
        value="23%"
        sub="Redução de custos"
        color="#38bdf8"
      />
      <FloatingCard
        pos="bottom-left"
        label="IA Insights"
        value="24"
        sub="Recomendações"
        color="#c084fc"
      />
      <FloatingCard
        pos="bottom-right"
        label="Inventário"
        value="1.284"
        sub="Itens"
        color="#fb923c"
      />

      {/* ── Connecting Lines (SVG) ── */}
      <svg className="l-hero-lines" viewBox="0 0 600 500" fill="none">
        <defs>
          <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(129,140,248,.35)" />
            <stop offset="100%" stopColor="rgba(99,102,241,.05)" />
          </linearGradient>
          <linearGradient id="lineGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(129,140,248,.35)" />
            <stop offset="100%" stopColor="rgba(99,102,241,.05)" />
          </linearGradient>
        </defs>
        {/* Lines from robot center to each card */}
        <path d="M300 250 Q200 120 110 70" stroke="url(#lineGrad1)" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.3" />
        <path d="M300 250 Q400 120 490 70" stroke="url(#lineGrad2)" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.3" />
        <path d="M300 250 Q180 220 100 190" stroke="url(#lineGrad1)" strokeWidth="1" strokeDasharray="3 7" opacity="0.25" />
        <path d="M300 250 Q420 220 500 190" stroke="url(#lineGrad2)" strokeWidth="1" strokeDasharray="3 7" opacity="0.25" />
        <path d="M300 250 Q200 340 110 380" stroke="url(#lineGrad1)" strokeWidth="1" strokeDasharray="4 6" opacity="0.2" />
        <path d="M300 250 Q400 340 490 380" stroke="url(#lineGrad2)" strokeWidth="1" strokeDasharray="4 6" opacity="0.2" />
      </svg>
    </div>
  )
}

/* ── Floating Card ── */
type CardPos = 'top-left' | 'top-right' | 'mid-left' | 'mid-right' | 'bottom-left' | 'bottom-right'

const CARD_POSITIONS: Record<CardPos, { top: string; left?: string; right?: string }> = {
  'top-left':     { top: '2%',  left: '-4%' },
  'top-right':    { top: '2%',  right: '-4%' },
  'mid-left':     { top: '26%', left: '-8%' },
  'mid-right':    { top: '26%', right: '-8%' },
  'bottom-left':  { top: '68%', left: '-4%' },
  'bottom-right': { top: '68%', right: '-4%' },
}

function FloatingCard({ pos, label, value, sub, color }: {
  pos: CardPos; label: string; value: string; sub: string; color: string
}) {
  const style = CARD_POSITIONS[pos]

  return (
    <div
      className="l-float-card"
      style={{
        position: 'absolute',
        ...style,
        animationDelay: `${Object.keys(CARD_POSITIONS).indexOf(pos) * 0.15}s`,
      }}
    >
      <span className="l-float-card-label">{label}</span>
      <div className="l-float-card-value" style={{ color }}>{value}</div>
      <span className="l-float-card-sub">{sub}</span>
    </div>
  )
}
