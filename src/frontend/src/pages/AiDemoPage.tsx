import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { apiClient } from '../services/apiClient'
import { Navbar } from '../components/landing/Navbar'
import { Footer } from '../components/landing/Footer'

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type ChatResponse = { text: string; provider: string; model: string; timestamp: string }

function getOrCreateSessionId(): string {
  const key = 'manugent-ai-demo-session'
  try {
    const existing = window.sessionStorage.getItem(key)
    if (existing) return existing
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `ai-demo-${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.sessionStorage.setItem(key, id)
    return id
  } catch {
    return `ai-demo-${Date.now()}`
  }
}

export function AiDemoPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const page = t.aiPage

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const sessionIdRef = useRef<string>('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    sessionIdRef.current = getOrCreateSessionId()
  }, [])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    const message = text.trim()
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
          context: { scope: 'landing_ai_demo' },
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
      sendMessage(input)
    }
  }

  const handleSuggestion = (text: string) => {
    inputRef.current?.focus()
    sendMessage(text)
  }

  return (
    <div className="l-page ai-demo-page" data-theme={theme}>
      <div className="l-noise" aria-hidden="true" />
      <div className="l-particles" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`l-particle l-particle-${(i % 4) + 1}`} />
        ))}
      </div>

      <Navbar />

      <header className="static-hero">
        <span className="badge badge-primary static-hero-badge">{page.badge}</span>
        <h1 className="static-hero-title">
          {page.titleLine1}
          <br />
          <span className="l-hero-title-gradient">{page.titleGradient}</span>
        </h1>
        <p className="static-hero-desc">{page.desc}</p>
      </header>

      <main className="ai-demo-layout">
        <aside className="ai-demo-side">
          <h2 className="ai-demo-side-title">{page.capabilitiesTitle}</h2>
          <div className="ai-demo-capabilities">
            {page.capabilities.map(cap => (
              <div className="ai-demo-capability" key={cap.title}>
                <div className="ai-demo-capability-icon"><i className={cap.icon} /></div>
                <div>
                  <h3>{cap.title}</h3>
                  <p>{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="ai-demo-suggestions">
            <h3>{page.suggestionsTitle}</h3>
            <div className="ai-demo-suggestions-list">
              {page.suggestions.map(s => (
                <button
                  type="button"
                  key={s}
                  className="ai-demo-chip"
                  onClick={() => handleSuggestion(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="ai-demo-chat" aria-label={page.chatTitle}>
          <div className="ai-demo-chat-header">
            <div className="ai-demo-chat-header-icon"><i className="fas fa-robot" /></div>
            <div className="ai-demo-chat-header-copy">
              <strong>{page.chatTitle}</strong>
              <span>{page.chatSubtitle}</span>
            </div>
          </div>

          <div className="ai-demo-chat-body" ref={listRef}>
            <div className="l-support-msg l-support-msg-assistant">{page.welcomeMessage}</div>
            {messages.map((m, i) => (
              <div key={i} className={`l-support-msg l-support-msg-${m.role}`}>{m.content}</div>
            ))}
            {loading && (
              <div className="l-support-msg l-support-msg-assistant l-support-msg-thinking">
                <span className="l-support-dot" />
                <span className="l-support-dot" />
                <span className="l-support-dot" />
              </div>
            )}
            {error && <div className="l-support-msg l-support-msg-error">{page.errorMessage}</div>}
          </div>

          <div className="ai-demo-chat-footer">
            <div className="l-support-input-row">
              <textarea
                ref={inputRef}
                className="l-support-input"
                placeholder={page.inputPlaceholder}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
              />
              <button
                type="button"
                className="l-support-send"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                aria-label={page.send}
              >
                <i className="fas fa-paper-plane" />
              </button>
            </div>
            <p className="l-support-disclaimer">{page.disclaimer}</p>
          </div>
        </section>
      </main>

      <section className="static-content static-content-narrow">
        <div className="static-card" style={{ marginTop: 8, textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>{page.ctaTitle}</h2>
          <p>{page.ctaDesc}</p>
          <Link to="/login" className="l-btn l-btn-primary l-btn-lg" style={{ marginTop: 12 }}>
            {page.ctaButton} <span className="l-btn-arrow">→</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
