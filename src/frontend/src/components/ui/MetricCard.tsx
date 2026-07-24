type MetricCardProps = {
  label: string
  value: string | number
  icon: string
  trend?: { value: number; label: string }
  className?: string
}

export function MetricCard({ label, value, icon, trend, className = '' }: MetricCardProps) {
  return (
    <article className={`metric-card animate-fade-in-up ${className}`}>
      <div>
        <div className="metric-card-label">{label}</div>
        <div className="metric-card-value">{value}</div>
        {trend && (
          <div style={{ fontSize: 12, marginTop: 4, color: trend.value >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            <i className={`fas fa-arrow-${trend.value >= 0 ? 'up' : 'down'}`} style={{ marginRight: 4 }} />
            {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
      <i className={`${icon} metric-card-icon`} aria-hidden="true" />
    </article>
  )
}
