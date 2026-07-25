import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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

  return (
    <div className="login-page">
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '8%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent)', pointerEvents: 'none' }} />

      <div className="login-card">
        <Link to="/landing">
          <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" className="login-logo" />
        </Link>
        <h1 className="login-title">Bem-vindo de volta</h1>
        <p className="login-subtitle">Acede à tua plataforma de manutenção inteligente</p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24, justifyContent: 'center' }}>
          {(['admin','gestor','tecnico','cliente'] as const).map(role => (
            <button
              key={role}
              type="button"
              className={`badge ${email.includes(role) ? 'badge-primary' : ''}`}
              style={{
                cursor: 'pointer', padding: '6px 12px', fontSize: 12,
                background: email.includes(role) ? undefined : 'rgba(99,102,241,0.06)',
                border: email.includes(role) ? undefined : '1px solid var(--border)',
                transition: 'all 0.2s ease', borderRadius: 'var(--radius)', color: 'var(--text-secondary)',
              }}
              onClick={() => setEmail(`${role}@manugent.pt`)}
            >
              {role}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="glass-input" placeholder="admin@manugent.pt" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="password" type={showPassword ? 'text' : 'password'} className="glass-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 42 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }} aria-label={showPassword ? 'Esconder password' : 'Mostrar password'}>
                <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fas fa-exclamation-circle" /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px 24px' }} disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> A entrar...</> : <><i className="fas fa-sign-in-alt" /> Entrar</>}
          </button>
        </form>

        <div className="login-footer">
          <a href="#">Esqueci a password</a>
          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>·</span>
          <Link to="/landing">Voltar ao site</Link>
        </div>
      </div>
    </div>
  )
}
