import { useEffect, useState } from 'react'

type AIStatus = {
  configured: boolean
  provider: string
  model: string | null
  providers: { openai: boolean; groq: boolean }
  message: string
}

export function AIConfigManager() {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/ai/status')
      .then(r => r.json())
      .then(d => { setStatus(d); setError(false); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Configuração do Agente IA</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Provedor de IA real usado pelo ManuGent. Esta configuração é exclusiva do SuperAdmin — não é visível nem editável nos painéis Admin, Gestor, Técnico ou Cliente.
          </p>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={load}>
          <i className="fas fa-rotate" /> Atualizar
        </button>
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-robot" style={{ color: 'var(--accent-light)', fontSize: 18 }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Estado do provedor</span>
          </div>
          {loading ? (
            <span className="badge">A verificar...</span>
          ) : error ? (
            <span className="badge badge-danger">Erro ao contactar o servidor</span>
          ) : status?.configured ? (
            <span className="badge badge-success">✓ IA ativa — {status.provider}</span>
          ) : (
            <span className="badge badge-warning">⚠ Sem configuração</span>
          )}
        </div>
        <div style={{ padding: 16, borderRadius: 'var(--radius)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', fontSize: 14 }}>
          {loading
            ? 'A contactar servidor...'
            : error
              ? 'Não foi possível obter o estado da IA. Tenta novamente.'
              : status?.configured
                ? `IA configurada: ${status.provider?.toUpperCase()} — modelo ${status.model}`
                : 'Nenhum provedor configurado. Configure OPENAI_API_KEY ou GROQ_API_KEY no .env do servidor e reinicie.'}
        </div>
      </div>

      <div className="admin-cards-grid" style={{ marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-bolt" style={{ color: '#34d399', fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                Groq (Recomendado) {status?.providers.groq && <span className="badge badge-success" style={{ marginLeft: 6, fontSize: 10 }}>Ativo</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Llama 3 — Ultra rápido, gratuito</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Configurar no servidor: <code style={{ color: '#34d399' }}>GROQ_API_KEY=gsk_...</code>
          </p>
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px', display: 'inline-flex' }}>
            <i className="fas fa-external-link-alt" /> Obter chave gratuita
          </a>
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-brain" style={{ color: '#60a5fa', fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                OpenAI {status?.providers.openai && <span className="badge badge-success" style={{ marginLeft: 6, fontSize: 10 }}>Ativo</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>GPT-4o-mini — Alta qualidade</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Configurar no servidor: <code style={{ color: '#60a5fa' }}>OPENAI_API_KEY=sk-...</code>
          </p>
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px', display: 'inline-flex' }}>
            <i className="fas fa-external-link-alt" /> Painel OpenAI
          </a>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        <i className="fas fa-info-circle" style={{ color: 'var(--accent-light)', marginRight: 6 }} />
        Para configurar: edita o ficheiro <code>.env</code> na raiz do servidor e reinicia. Variáveis: <code>OPENAI_API_KEY</code>, <code>GROQ_API_KEY</code>, <code>AI_PROVIDER</code> (openai|groq), <code>AI_MODEL</code>.
      </div>
    </div>
  )
}
