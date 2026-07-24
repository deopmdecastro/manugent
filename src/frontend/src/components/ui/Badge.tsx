type BadgeProps = {
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  children: React.ReactNode
}

export function Badge({ variant = 'primary', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}
