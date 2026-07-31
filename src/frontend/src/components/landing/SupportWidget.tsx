import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { apiClient } from '../../services/apiClient'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatResponse = {
  text: string
  provider: string
  model: string
  timestamp: string
}

function getOrCreateSessionId(): string {
  const key = 'manugent-public-support-session'
  try {
    const existing = window.sessionStorage.getItem(key)
    if (existing) return existing
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `public-${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.sessionStorage.setItem(key, id)
    return id
  } catch {
    return `public-${Date.now()}`
  }
}

export function SupportWidget() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const sessionIdRef = useRef<string>('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId()
  }, [])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, loading, open])

  const handleSend = async () => {
    const message = input.trim()
    if (!message || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: message }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError(false)

    try {
      const response = await apiClient<ChatResponse>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          history: nextMessages.slice(-10),
          context: { scope: 'public_support' },
          sessionId: sessionIdRef.current,
        }),
      })
      setMessages(current => [...current, { role: 'assistant', content: response.text }])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="l-support">
      {open && (
        <div className="l-support-panel" role="dialog" aria-label={t.support.panelTitle}>
          <div className="l-support-panel-header">
            <div className="l-support-panel-header-icon">
              <i className="fas fa-robot" />
            </div>
            <div className="l-support-panel-header-copy">
              <strong>{t.support.panelTitle}</strong>
              <span>{t.support.panelSubtitle}</span>
            </div>
            <button
              type="button"
              className="l-support-close"
              onClick={() => setOpen(false)}
              aria-label={t.support.close}
            >
              <i className="fas fa-xmark" />
            </button>
          </div>

          <div className="l-support-panel-body" ref={listRef}>
            <div className="l-support-msg l-support-msg-assistant">
              {t.support.welcomeMessage}
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`l-support-msg l-support-msg-${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="l-support-msg l-support-msg-assistant l-support-msg-thinking">
                <span className="l-support-dot" />
                <span className="l-support-dot" />
                <span className="l-support-dot" />
              </div>
            )}
            {error && (
              <div className="l-support-msg l-support-msg-error">{t.support.errorMessage}</div>
            )}
          </div>

          <div className="l-support-panel-footer">
            <div className="l-support-input-row">
              <textarea
                className="l-support-input"
                placeholder={t.support.inputPlaceholder}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                type="button"
                className="l-support-send"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label={t.support.send}
              >
                <i className="fas fa-paper-plane" />
              </button>
            </div>
            <p className="l-support-disclaimer">{t.support.disclaimer}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`l-support-fab${open ? ' is-open' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <i className={open ? 'fas fa-xmark' : 'fas fa-headset'} />
        <span>{t.support.buttonLabel}</span>
      </button>
    </div>
  )
}
