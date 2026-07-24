type EmptyStateProps = {
  icon: string
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <i className={`${icon} empty-state-icon`} aria-hidden="true" />
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{description}</div>
      {action && (
        <button className="btn btn-primary" onClick={action.onClick}>
          <i className="fas fa-plus" /> {action.label}
        </button>
      )}
    </div>
  )
}
