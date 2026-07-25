import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ROLES = [
  { key: 'admin', label: 'admin', email: 'admin@manugent.pt' },
  { key: 'gestor', label: 'gestor', email: 'gestor@manugent.pt' },
  { key: 'tecnico', label: 'técnico', email: 'tecnico@manugent.pt' },
  { key: 'cliente', label: 'cliente', email: 'cliente@demo.pt' },
] as const

const FEATURES = [
  {
    icon: 'fa-chart-line',
    title: 'Dashboards inteligentes',
    desc: 'Dados em tempo real para decisões assertivas',
  },
  {
    icon: 'fa-boxes-stacked',
    title: 'Gestão de ativos',
    desc: 'Controlo completo do ciclo de vida dos equipamentos',
  },
  {
    icon: 'fa-shield-halved',
    title: 'Segurança e confiabilidade',
    desc: 'Autenticação real, dados protegidos e acesso controlado',
  },
]

export function LoginPage() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lightPreview, setLightPreview] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Preenche todos os campos.')
      return
    }
    try {
      await login(email, password)
      window.location.href = '/app/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão. Tenta novamente.')
    }
  }

  const activeRole = ROLES.find(r => email === r.email)?.key

  return (
    <div className="auth-page" data-theme={lightPreview ? 'light' : 'dark'}>
      <header className="auth-topbar">
        <Link to="/landing" className="auth-brand">
          <img src="/app/assets/icon_manugent_white.png" alt="" className="auth-brand-mark" />
          <span className="auth-brand-text">
            <strong>ManuGent</strong>
            <small>Plataforma de Manutenção Inteligente</small>
          </span>
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

      <main className="auth-main">
        <section className="auth-pitch">
          <span className="badge badge-primary auth-eyebrow">
            <i className="fas fa-wand-magic-sparkles" /> Gestão inteligente
          </span>
          <h1 className="auth-headline">
            Simplifique.<br />
            Otimize.<br />
            <span className="auth-headline-accent">Transforme.</span>
          </h1>
          <p className="auth-subhead">
            O ManuGent ajuda a tua equipa a gerir manutenção, ativos e ordens de serviço
            de forma eficiente e inteligente.
          </p>

          <ul className="auth-feature-list">
            {FEATURES.map(f => (
              <li key={f.title} className="auth-feature">
                <span className="auth-feature-icon"><i className={`fas ${f.icon}`} /></span>
                <span>
                  <strong>{f.title}</strong>
                  <small>{f.desc}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-card-avatar">
              <img src="/app/assets/icon_manugent_white.png" alt="ManuGent" />
            </div>
            <h2 className="auth-card-title">Bem-vindo de volta!</h2>
            <p className="auth-card-subtitle">Acede à tua conta para continuar</p>

            <div className="auth-role-pills" role="tablist" aria-label="Escolher perfil de demonstração">
              {ROLES.map(r => (
                <button
                  key={r.key}
                  type="button"
                  role="tab"
                  aria-selected={activeRole === r.key}
                  className={`auth-role-pill ${activeRole === r.key ? 'is-active' : ''}`}
                  onClick={() => setEmail(r.email)}
                >
                  <i className="fas fa-user" /> {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <div className="auth-input-group">
                  <i className="fas fa-envelope" />
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@manugent.pt"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <div className="auth-input-group">
                  <i className="fas fa-lock" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-input-adornment"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Esconder password' : 'Mostrar password'}
                  >
                    <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-error" role="alert">
                  <i className="fas fa-circle-exclamation" /> {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading
                  ? <><i className="fas fa-spinner fa-spin" /> A entrar...</>
                  : <><i className="fas fa-right-to-bracket" /> Entrar</>}
              </button>
            </form>

            <div className="auth-divider"><span>ou</span></div>

            <div className="auth-card-links">
              <a href="#"><i className="fas fa-lock" /> Esqueci a password</a>
              <p>Não tens uma conta? <a href="#">Contacta o administrador.</a></p>
            </div>
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
