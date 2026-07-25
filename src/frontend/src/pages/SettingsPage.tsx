import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ConfirmModal } from '../components/ui/ConfirmModal'

type SettingsTab = 'profile' | 'appearance' | 'ai' | 'security' | 'team'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<SettingsTab>('profile')
  const [saved, setSaved] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const TABS: { key: SettingsTab; label: string; icon: string; roles: string[] }[] = [
    { key: 'profile', label: 'Perfil', icon: 'fas fa-user', roles: ['admin','gestor','tecnico','cliente'] },
    { key: 'appearance', label: 'Aparência', icon: 'fas fa-palette', roles: ['admin','gestor','tecnico','cliente'] },
    { key: 'ai', label: 'IA', icon: 'fas fa-robot', roles: ['admin','gestor'] },
    { key: 'security', label: 'Segurança', icon: 'fas fa-shield-halved', roles: ['admin','gestor','tecnico','cliente'] },
    { key: 'team', label: 'Equipa', icon: 'fas fa-users', roles: ['admin'] },
  ]

  return (
    <div className="page-stack animate-fade-in" style={{ maxWidth: 1000 }}>
      <div className="page-header">
        <p className="eyebrow">Sistema</p>
        <h1 className="page-title">Definições</h1>
        <p className="page-subtitle">Configura o teu perfil, segurança e preferências da plataforma.</p>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Side tabs */}
        <div className="glass-card" style={{ padding: 8, minWidth: 200, flexShrink: 0, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.filter(t => t.roles.includes(user?.role || '')).map(t => (
            <button
              key={t.key}
              className={`sidebar-link${tab === t.key ? ' active' : ''}`}
              style={{ minHeight: 42 }}
              onClick={() => setTab(t.key)}
            >
              <i className={t.icon} style={{ width: 20, textAlign: 'center' }} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card" style={{ flex: 1, padding: 28, minWidth: 280 }}>
          {tab === 'profile' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Perfil</h3>
              <div className="login-field">
                <label>Nome</label>
                <input className="glass-input" defaultValue={user?.name} />
              </div>
              <div className="login-field">
                <label>Email</label>
                <input className="glass-input" defaultValue={user?.email} />
              </div>
              <div className="login-field">
                <label>Telefone</label>
                <input className="glass-input" placeholder="+351 912 345 678" />
              </div>
              <button className="btn btn-primary" onClick={handleSave}>
                {saved ? <><i className="fas fa-check" /> Guardado</> : <><i className="fas fa-save" /> Guardar alterações</>}
              </button>
            </div>
          )}

          {tab === 'appearance' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Aparência</h3>
              <div className="login-field">
                <label>Tema</label>
                <select className="glass-input" defaultValue="dark">
                  <option value="dark">Escuro (Dark)</option>
                  <option value="darker">Ultra Escuro</option>
                  <option value="system">Sistema</option>
                </select>
              </div>
              <div className="login-field">
                <label>Densidade</label>
                <select className="glass-input" defaultValue="comfortable">
                  <option value="compact">Compacto</option>
                  <option value="comfortable">Confortável</option>
                  <option value="spacious">Espaçoso</option>
                </select>
              </div>
              <div className="login-field">
                <label>Sidebar por defeito</label>
                <select className="glass-input" defaultValue="expanded">
                  <option value="expanded">Expandida</option>
                  <option value="collapsed">Recolhida</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleSave}>
                {saved ? <><i className="fas fa-check" /> Guardado</> : <><i className="fas fa-save" /> Guardar</>}
              </button>
            </div>
          )}

          {tab === 'ai' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Configuração IA</h3>
              <div className="login-field">
                <label>Provider</label>
                <select className="glass-input" defaultValue="groq">
                  <option value="groq">Groq (Llama 3 — Grátis)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                  <option value="none">Desativado (modo local)</option>
                </select>
              </div>
              <div className="login-field">
                <label>API Key</label>
                <input className="glass-input" type="password" placeholder="gsk_..." />
              </div>
              <div className="login-field">
                <label>Temperatura</label>
                <input className="glass-input" type="range" min="0" max="100" defaultValue="70" style={{ padding: 0 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Preciso (0)</span><span>Criativo (100)</span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleSave}>
                {saved ? <><i className="fas fa-check" /> Guardado</> : <><i className="fas fa-save" /> Guardar configuração</>}
              </button>
            </div>
          )}

          {tab === 'security' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Segurança</h3>
              <div className="login-field">
                <label>Password atual</label>
                <input className="glass-input" type="password" placeholder="••••••••" />
              </div>
              <div className="login-field">
                <label>Nova password</label>
                <input className="glass-input" type="password" placeholder="••••••••" />
              </div>
              <div className="login-field">
                <label>Confirmar nova password</label>
                <input className="glass-input" type="password" placeholder="••••••••" />
              </div>
              <button className="btn btn-primary" onClick={handleSave}><i className="fas fa-key" /> Alterar password</button>

              <hr className="glass-divider" />

              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Sessão</h4>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => setConfirmLogout(true)}>
                  <i className="fas fa-sign-out-alt" /> Terminar sessão
                </button>
                <button className="btn btn-danger" onClick={() => setConfirmDelete(true)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  <i className="fas fa-trash" /> Eliminar conta
                </button>
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Gestão de Equipa</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Convida membros e gere permissões da tua equipa.</p>
              <div className="login-field">
                <label>Convidar por email</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="glass-input" placeholder="tecnico@exemplo.pt" />
                  <button className="btn btn-primary" style={{ flexShrink: 0 }}><i className="fas fa-plus" /> Convidar</button>
                </div>
              </div>
              <hr className="glass-divider" />
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Membros atuais</h4>
              {['Admin ManuGent','Gestor Silva','Técnico Costa'].map((name, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=36`} alt="" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)' }} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{name}</span>
                  <span className="badge badge-primary">{['Admin','Gestor','Técnico'][i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal open={confirmLogout} onClose={() => setConfirmLogout(false)} onConfirm={logout} title="Terminar sessão" message="Tens a certeza que queres terminar a sessão? Terás de iniciar sessão novamente." variant="primary" />
      <ConfirmModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => {}} title="Eliminar conta" message="Esta ação é irreversível. Todos os teus dados serão permanentemente eliminados. Tens a certeza?" confirmLabel="Sim, eliminar" variant="danger" />
    </div>
  )
}
