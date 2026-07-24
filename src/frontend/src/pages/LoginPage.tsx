import { useState } from 'react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simula login — a integrar com JWT futuramente
    setTimeout(() => setLoading(false), 800)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img
          src="/app/assets/ManuGent_logo.png"
          alt="ManuGent"
          className="login-logo"
        />
        <h1 className="login-title">Bem-vindo de volta</h1>
        <p className="login-subtitle">Acede à tua plataforma de manutenção inteligente</p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="glass-input"
              placeholder="admin@manugent.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="glass-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                A entrar...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt" />
                Entrar
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="#">Esqueci a password</a>
          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>·</span>
          <a href="#">Criar conta</a>
        </div>
      </div>
    </div>
  )
}
