import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

const STAT_META = [
  { value: 2500, prefix: '+', suffix: '' },
  { value: 15000, prefix: '+', suffix: '' },
  { value: 98, prefix: '+', suffix: '%' },
  { value: 23, prefix: '-', suffix: '%' },
]

// Portuguese/European thousands grouping: 2500 -> "2.500", 15000 -> "15.000"
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
  const { t } = useLanguage()
  const stats = STAT_META.map((meta, i) => ({ ...meta, label: t.stats.items[i].label }))

  return (
    <section className="l-stats">
      <div className="l-stats-inner l-reveal">
        <div className="l-stats-trust">
          <img src="/app/assets/icon_manugent.png" alt="" className="l-stats-trust-icon" />
          <span className="l-stats-trust-copy">
            <strong>{t.stats.trustTitle}</strong>
            <span>{t.stats.trustSub}</span>
          </span>
        </div>
        <div className="l-stats-grid">
          {stats.map(s => (
            <AnimatedCounter key={s.label} value={s.value} prefix={s.prefix} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  )
}
