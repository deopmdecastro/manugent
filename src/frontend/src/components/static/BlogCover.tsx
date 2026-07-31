interface BlogCoverProps {
  icon: string
  gradient: string
  className?: string
}

export function BlogCover({ icon, gradient, className }: BlogCoverProps) {
  return (
    <div className={`static-blog-cover${className ? ` ${className}` : ''}`} style={{ background: gradient }}>
      <i className={icon} aria-hidden="true" />
    </div>
  )
}
