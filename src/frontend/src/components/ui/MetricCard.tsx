type MetricCardProps = {
  label: string
  value: string
  icon: string
}

export function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <i className={icon} aria-hidden="true" />
    </article>
  )
}
