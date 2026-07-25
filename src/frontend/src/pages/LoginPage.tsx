import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Preenche todos os campos.')
      return
    }
    try {
      await login(email)
      window.location.hash = '#dashboard'
    } catch {
      setError('Erro ao iniciar sessão. Tenta novamente.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" className="login-logo" />
        <h1 className="login-title">Bem-vindo de volta</h1>
        <p className="login-subtitle">Acede à tua plataforma de manutenção inteligente</p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="glass-input" placeholder="admin@manugent.pt" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="glass-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}><i className="fas fa-exclamation-circle" /> {error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> A entrar...</> : <><i className="fas fa-sign-in-alt" /> Entrar</>}
          </button>
        </form>

        <div className="login-footer">
          <a href="#">Esqueci a password</a>
          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>·</span>
          <a href="#landing">Voltar ao site</a>
        </div>
      </div>
    </div>
  )
}
