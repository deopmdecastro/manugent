import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 2500, suffix: '', label: 'Utilizadores ativos' },
  { value: 15000, suffix: '', label: 'Ordens de serviço' },
  { value: 98, suffix: '%', label: 'Satisfação dos clientes' },
  { value: 23, suffix: '%', label: 'Redução de custos' },
]

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
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

  const formatted = suffix === '%' ? count : count >= 1000 ? `${Math.floor(count / 1000)}.${Math.floor((count % 1000) / 100)}` : count

  return (
    <div className="l-stat">
      <span className="l-stat-value" ref={ref}>
        <span className="l-stat-plus">+</span>
        {formatted}
        <span className="l-stat-suffix">{suffix}</span>
      </span>
      <span className="l-stat-label">{STATS.find(s => s.value === value && s.suffix === suffix)?.label}</span>
    </div>
  )
}

export function StatsBar() {
  return (
    <section className="l-stats">
      <div className="l-stats-inner">
        <div className="l-stats-trust">
          <span className="l-stats-trust-label">Confiado por equipas em todo o mundo</span>
        </div>
        <div className="l-stats-grid">
          {STATS.map(s => (
            <AnimatedCounter key={s.label} value={s.value} suffix={s.suffix} />
          ))}
        </div>
      </div>
    </section>
  )
}
