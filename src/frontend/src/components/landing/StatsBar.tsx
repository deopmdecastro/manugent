import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 2500, prefix: '+', suffix: '', label: 'Utilizadores ativos' },
  { value: 15000, prefix: '+', suffix: '', label: 'Ordens de serviço' },
  { value: 98, prefix: '+', suffix: '%', label: 'Satisfação dos clientes' },
  { value: 23, prefix: '-', suffix: '%', label: 'Redução de custos' },
]

// Portuguese thousands grouping: 2500 -> "2.500", 15000 -> "15.000"
function formatPt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function AnimatedCounter({ value, prefix, suffix, label }: { value: number; prefix: string; suffix: string; label: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const duration = 1800
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [visible, value])

  const formatted = suffix === '%' ? count : formatPt(count)

  return (
    <div className="l-stat">
      <span className="l-stat-value" ref={ref}>
        <span className="l-stat-prefix">{prefix}</span>
        {formatted}
        <span className="l-stat-suffix">{suffix}</span>
      </span>
      <span className="l-stat-label">{label}</span>
    </div>
  )
}

export function StatsBar() {
  return (
    <section className="l-stats">
      <div className="l-stats-inner l-reveal">
        <div className="l-stats-trust">
          <img src="/app/assets/icon_manugent.png" alt="" className="l-stats-trust-icon" />
          <span className="l-stats-trust-copy">
            <strong>Confiado por equipas</strong>
            <span>em todo o mundo</span>
          </span>
        </div>
        <div className="l-stats-grid">
          {STATS.map(s => (
            <AnimatedCounter key={s.label} value={s.value} prefix={s.prefix} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  )
}
