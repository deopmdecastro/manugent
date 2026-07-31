import { useState } from 'react'
import { Link } from 'react-router-dom'

export function ContactAdminPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [lightPreview, setLightPreview] = useState(false)

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Preenche o nome, email e mensagem.')
      return
    }
    setLoading(true)
    try {
      await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
        <section className="auth-card-wrap" style={{ maxWidth: '480px' }}>
          <div className="auth-card">
            <div className="auth-card-avatar">
              <img src="/app/assets/icon_manugent_white.png" alt="ManuGent" />
            </div>

            {sent ? (
              <>
                <h2 className="auth-card-title">Pedido enviado</h2>
                <p className="auth-card-subtitle">
                  O administrador da tua organização foi notificado. Vais receber um email assim que a tua
                  conta for criada.
                </p>

                <Link to="/login" className="btn btn-primary auth-submit" style={{ marginTop: '8px' }}>
                  <i className="fas fa-arrow-left" /> Voltar ao login
                </Link>
              </>
            ) : (
              <>
                <h2 className="auth-card-title">Contacta o administrador</h2>
                <p className="auth-card-subtitle">
                  Não tens uma conta ManuGent? Preenche os teus dados e o administrador da tua organização
                  irá tratar do teu acesso.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="auth-field">
                    <label htmlFor="admin-name">Nome</label>
                    <div className="auth-input-group">
                      <i className="fas fa-user" />
                      <input
                        id="admin-name"
                        type="text"
                        placeholder="O teu nome"
                        value={form.name}
                        onChange={handleChange('name')}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="admin-email">Email</label>
                    <div className="auth-input-group">
                      <i className="fas fa-envelope" />
                      <input
                        id="admin-email"
                        type="email"
                        placeholder="tu@empresa.pt"
                        value={form.email}
                        onChange={handleChange('email')}
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="admin-company">Empresa</label>
                    <div className="auth-input-group">
                      <i className="fas fa-building" />
                      <input
                        id="admin-company"
                        type="text"
                        placeholder="Nome da empresa"
                        value={form.company}
                        onChange={handleChange('company')}
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="admin-message">Mensagem</label>
                    <div className="auth-input-group" style={{ alignItems: 'flex-start', padding: '12px 14px' }}>
                      <i className="fas fa-message" style={{ marginTop: '3px' }} />
                      <textarea
                        id="admin-message"
                        placeholder="Explica brevemente o acesso que precisas"
                        value={form.message}
                        onChange={handleChange('message')}
                        required
                        rows={4}
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', padding: '12px 0' }}
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
                      : <><i className="fas fa-paper-plane" /> Enviar pedido</>}
                  </button>
                </form>

                <div className="auth-divider"><span>ou</span></div>

                <div className="auth-card-links">
                  <Link to="/login"><i className="fas fa-arrow-left" /> Voltar ao login</Link>
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
