import type { PropsWithChildren, HTMLAttributes } from 'react'

type GlassCardProps = PropsWithChildren<{
  interactive?: boolean
  className?: string
  style?: HTMLAttributes<HTMLDivElement>['style']
}>

export function GlassCard({ children, interactive = false, className = '', style }: GlassCardProps) {
  return (
    <div
      className={`glass-card${interactive ? ' glass-card-interactive' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
