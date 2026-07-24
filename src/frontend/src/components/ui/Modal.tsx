import { useEffect, useCallback, type PropsWithChildren, type MouseEvent } from 'react'

type ModalProps = PropsWithChildren<{
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'glass' | 'solid'
}>

const SIZES = { sm: 400, md: 520, lg: 680, xl: 900 }

export function Modal({ open, onClose, title, children, size = 'md', variant = 'glass' }: ModalProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, handleKey])

  if (!open) return null

  const stopProp = (e: MouseEvent) => e.stopPropagation()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-container modal-${variant}`}
        style={{ maxWidth: SIZES[size] }}
        onClick={stopProp}
      >
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button className="modal-close icon-button" onClick={onClose} aria-label="Fechar">
              <i className="fas fa-times" />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
