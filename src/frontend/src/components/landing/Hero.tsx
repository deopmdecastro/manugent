import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

export function Hero() {
  const { t } = useLanguage()

  return (
    <section className="l-hero">
      <div className="l-hero-grid">
        {/* ── LEFT COLUMN ── */}
        <div className="l-hero-content l-reveal">
          {/* Badge */}
          <div className="l-hero-badge">
            <span className="l-hero-badge-dot" />
            {t.hero.badge}
          </div>

          {/* Title */}
          <h1 className="l-hero-title">
            {t.hero.titleLine1}
            <br />
            {t.hero.titleLine2}
            <br />
            <span className="l-hero-title-gradient">{t.hero.titleGradient}</span>
          </h1>

          {/* Description */}
          <p className="l-hero-desc">
            {t.hero.desc}
          </p>

          {/* CTAs */}
          <div className="l-hero-actions">
            <Link to="/login" className="l-btn l-btn-primary l-btn-lg">
              {t.hero.ctaPrimary} <span className="l-btn-arrow">→</span>
            </Link>
            <Link to="/funcionalidades" className="l-btn l-btn-ghost">
              {t.hero.ctaSecondary}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
                <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
              </svg>
            </Link>
          </div>

          {/* Perks */}
          <div className="l-hero-perks">
            <div className="l-hero-perk">
              <div className="l-hero-perk-icon l-hero-perk-icon-green">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1L3 3v4c0 3.5 2 6.5 5 8 3-1.5 5-4.5 5-8V3L8 1z"/><path d="M5.8 8l1.6 1.6 3-3.2"/></svg>
              </div>
              <div>
                <strong>{t.hero.perks[0].title}</strong>
                <span>{t.hero.perks[0].desc}</span>
              </div>
            </div>
            <div className="l-hero-perk">
              <div className="l-hero-perk-icon l-hero-perk-icon-violet">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none"><path d="M8.6 1L3 9h3.6l-1.2 6L12 7H8.4z"/></svg>
              </div>
              <div>
                <strong>{t.hero.perks[1].title}</strong>
                <span>{t.hero.perks[1].desc}</span>
              </div>
            </div>
            <div className="l-hero-perk">
              <div className="l-hero-perk-icon l-hero-perk-icon-blue">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="2"/><circle cx="11" cy="5" r="2"/><path d="M3 13l3-3 2 2 4-4"/></svg>
              </div>
              <div>
                <strong>{t.hero.perks[2].title}</strong>
                <span>{t.hero.perks[2].desc}</span>
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
  const { t } = useLanguage()
  const cards = t.hero.cards

  return (
    <div className="l-hero-scene">
      {/* Background glows */}
      <div className="l-hero-glow l-hero-glow-1" />
      <div className="l-hero-glow l-hero-glow-2" />
      <div className="l-hero-glow l-hero-glow-3" />

      {/* Pedestal base image under the robot */}
      <div className="l-hero-pedestal">
        <img
          src="/app/assets/pedestal_base.png"
          alt=""
          className="l-hero-pedestal-img"
        />
      </div>

      {/* Robot */}
      <div className="l-hero-robot">
        <img src="/app/assets/3d_mascot.png" alt="ManuGent AI Robot" />
      </div>

      {/* ── Floating Cards ── */}
      <FloatingCard
        pos="top-left"
        label={cards.orders.label}
        value="128"
        sub={cards.orders.sub}
        icon="check"
        color="#818cf8"
      />
      <FloatingCard
        pos="top-right"
        label={cards.maintenance.label}
        value="96%"
        sub={cards.maintenance.sub}
        icon="tool"
        color="#34d399"
      />
      <FloatingCard
        pos="mid-left"
        label={cards.assets.label}
        value="342"
        sub={cards.assets.sub}
        icon="box"
        color="#fbbf24"
      />
      <FloatingCard
        pos="mid-right"
        label={cards.ai.label}
        value="24"
        sub={cards.ai.sub}
        icon="brain"
        color="#c084fc"
      />
      <FloatingCard
        pos="bottom-left"
        label={cards.inventory.label}
        value="1.284"
        sub={cards.inventory.sub}
        icon="inventory"
        color="#fb923c"
      />
      <FloatingCard
        pos="bottom-right"
        label={cards.savings.label}
        value="23%"
        sub={cards.savings.sub}
        icon="money"
        color="#38bdf8"
      />

      {/* ── Connecting Lines (SVG) ── */}
      <svg className="l-hero-lines" viewBox="0 0 600 560" fill="none">
        <defs>
          <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(129,140,248,.4)" />
            <stop offset="100%" stopColor="rgba(99,102,241,.05)" />
          </linearGradient>
          <linearGradient id="lineGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(129,140,248,.4)" />
            <stop offset="100%" stopColor="rgba(99,102,241,.05)" />
          </linearGradient>
        </defs>
        {/* Lines from robot center to each card, matching the tightened cluster */}
        <path d="M300 298 Q214 188 126 94" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeDasharray="4 7" opacity="0.42" />
        <path d="M300 298 Q395 188 505 94" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeDasharray="4 7" opacity="0.42" />
        <path d="M300 298 Q178 266 82 248" stroke="url(#lineGrad1)" strokeWidth="1.35" strokeDasharray="4 7" opacity="0.36" />
        <path d="M300 298 Q425 266 518 248" stroke="url(#lineGrad2)" strokeWidth="1.35" strokeDasharray="4 7" opacity="0.36" />
        <path d="M300 298 Q204 372 112 418" stroke="url(#lineGrad1)" strokeWidth="1.35" strokeDasharray="4 7" opacity="0.34" />
        <path d="M300 298 Q392 372 510 418" stroke="url(#lineGrad2)" strokeWidth="1.35" strokeDasharray="4 7" opacity="0.34" />
      </svg>
    </div>
  )
}

/* ── Floating Card ── */
type CardPos = 'top-left' | 'top-right' | 'mid-left' | 'mid-right' | 'bottom-left' | 'bottom-right'
type CardIcon = 'check' | 'tool' | 'box' | 'brain' | 'inventory' | 'money'

const CARD_POSITIONS: Record<CardPos, { top: string; left?: string; right?: string; rotate: string }> = {
  'top-left':     { top: '4%',  left: '12%', rotate: '5deg' },
  'top-right':    { top: '4%',  right: '2%', rotate: '-4deg' },
  'mid-left':     { top: '29%', left: '5%', rotate: '1deg' },
  'mid-right':    { top: '29%', right: '1%', rotate: '-1deg' },
  'bottom-left':  { top: '55%', left: '7%', rotate: '-4deg' },
  'bottom-right': { top: '55%', right: '2%', rotate: '5deg' },
}

function FloatingCard({ pos, label, value, sub, icon, color }: {
  pos: CardPos; label: string; value: string; sub: string; icon: CardIcon; color: string
}) {
  const { rotate, ...position } = CARD_POSITIONS[pos]

  return (
    <div
      className="l-float-card"
      style={{
        position: 'absolute',
        ...position,
        '--card-rotate': rotate,
        '--card-color': color,
        animationDelay: `${Object.keys(CARD_POSITIONS).indexOf(pos) * 0.15}s`,
      } as CSSProperties}
    >
      <span className="l-float-card-icon" aria-hidden="true">
        <CardIconSvg icon={icon} />
      </span>
      <span className="l-float-card-copy">
        <span className="l-float-card-label">{label}</span>
        <span className="l-float-card-value">{value}</span>
        <span className="l-float-card-sub">{sub}</span>
      </span>
    </div>
  )
}

function CardIconSvg({ icon }: { icon: CardIcon }) {
  const common = {
    width: 31,
    height: 31,
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (icon === 'check') return <svg {...common}><rect x="7" y="7" width="18" height="21" rx="3" /><path d="M11 5h10" /><path d="M12 18l3 3 6-8" /></svg>
  if (icon === 'tool') return <svg {...common}><path d="M21 5a7 7 0 0 0-8.5 8.5L5 21l6 6 7.5-7.5A7 7 0 0 0 27 11l-5 5-6-6 5-5z" /></svg>
  if (icon === 'box') return <svg {...common}><path d="M16 4l10 5.5v13L16 28 6 22.5v-13L16 4z" /><path d="M6 9.5l10 5.5 10-5.5" /><path d="M16 15v13" /></svg>
  if (icon === 'brain') return <svg {...common}><path d="M12 6a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5" /><path d="M20 6a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5" /><path d="M12 6v20M20 6v20M8 14h8M16 18h8" /></svg>
  if (icon === 'inventory') return <svg {...common}><path d="M5 12l11 5 11-5" /><path d="M5 12l11-5 11 5v12l-11 5-11-5V12z" /><path d="M16 17v12" /></svg>
  return <svg {...common}><circle cx="16" cy="16" r="12" /><path d="M19 11.5a4 4 0 0 0-3-1.5c-2 0-3.5 1.1-3.5 2.7 0 4 7 2.1 7 6.1 0 1.7-1.5 3-3.6 3a5 5 0 0 1-3.9-1.9" /><path d="M16 7.5v17" /></svg>
}
