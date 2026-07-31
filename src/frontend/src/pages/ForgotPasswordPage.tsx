import { useState } from 'react'
import { Link } from 'react-router-dom'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [lightPreview, setLightPreview] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Introduz o teu email.')
      return
    }
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {})
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" data-theme={lightPreview ? 'light' : 'dark'}>
      <div className="auth-noise" aria-hidden="true" />
      <div className="auth-particles" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`auth-particle auth-particle-${(i % 4) + 1}`} />
        ))}
      </div>

      <header className="auth-topbar">
        <Link to="/landing" className="auth-brand">
          <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" className="auth-brand-logo" />
        </Link>
        <div className="auth-topbar-actions">
          <button
            type="button"
            className="auth-icon-btn"
            onClick={() => setLightPreview(v => !v)}
            aria-label={lightPreview ? 'Ativar tema escuro' : 'Pré-visualizar tema claro'}
            title={lightPreview ? 'Tema escuro' : 'Tema claro'}
          >
            <i className={`fas ${lightPreview ? 'fa-moon' : 'fa-sun'}`} />
          </button>
          <span className="auth-lang-chip" title="Mais idiomas brevemente">
            <i className="fas fa-globe" /> Português
          </span>
        </div>
      </header>

      <main className="auth-main" style={{ justifyContent: 'center' }}>
        <section className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-card-avatar">
              <img src="/app/assets/icon_manugent_white.png" alt="ManuGent" />
            </div>

            {sent ? (
              <>
                <h2 className="auth-card-title">Verifica o teu email</h2>
                <p className="auth-card-subtitle">
                  Se existir uma conta associada a <strong>{email}</strong>, vais receber um email com
                  instruções para repor a tua password nos próximos minutos.
                </p>

                <Link to="/login" className="btn btn-primary auth-submit" style={{ marginTop: '8px' }}>
                  <i className="fas fa-arrow-left" /> Voltar ao login
                </Link>

                <div className="auth-card-links" style={{ marginTop: '18px' }}>
                  <p>
                    Não recebeste o email?{' '}
                    <a href="#" onClick={e => { e.preventDefault(); setSent(false) }}>Tentar novamente</a>
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="auth-card-title">Esqueci a password</h2>
                <p className="auth-card-subtitle">
                  Introduz o email da tua conta e enviamos-te instruções para criar uma nova password.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="auth-field">
                    <label htmlFor="forgot-email">Email</label>
                    <div className="auth-input-group">
                      <i className="fas fa-envelope" />
                      <input
                        id="forgot-email"
                        type="email"
                        placeholder="tu@empresa.pt"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="username"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="auth-error" role="alert">
                      <i className="fas fa-circle-exclamation" /> {error}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                    {loading
                      ? <><i className="fas fa-spinner fa-spin" /> A enviar...</>
                      : <><i className="fas fa-paper-plane" /> Enviar instruções</>}
                  </button>
                </form>

                <div className="auth-divider"><span>ou</span></div>

                <div className="auth-card-links">
                  <Link to="/login"><i className="fas fa-arrow-left" /> Voltar ao login</Link>
                  <p>Não tens uma conta? <Link to="/contactar-administrador">Contacta o administrador.</Link></p>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="auth-footer">
        <span className="auth-version-badge"><i className="fas fa-circle" /> v2.0.0</span>
        <p>© {new Date().getFullYear()} ManuGent. Todos os direitos reservados.</p>
        <span className="auth-secure-badge"><i className="fas fa-circle-check" /> Seguro e protegido</span>
      </footer>
    </div>
  )
}
