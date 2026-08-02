import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../services/apiClient'

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  tax_id: string | null
  sector: string | null
  active: boolean
  empresa_id: string | null
  created_at: string
}

type Collaborator = {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  department: string | null
  job_position: string | null
  permissions: string[]
  status: string
}

type Folder = {
  id: string
  name: string
  parent_id: string | null
  folder_type: string
  empresa_id: string | null
  client_id: string | null
  created_at: string
  sort_order: number
}

type Tab = 'overview' | 'clients' | 'collaborators' | 'folders'

export function EmpresaAdminPage() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')
  const [clients, setClients] = useState<Client[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const empresaId = user?.empresaId

  const loadClients = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const data = await apiClient<{ clients: Client[] }>(`/api/empresas/${id}/clients`)
      setClients(data.clients || [])
    } catch { setError('Erro ao carregar clientes') }
    setLoading(false)
  }, [])

  const loadCollaborators = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const data = await apiClient<{ collaborators: Collaborator[] }>(`/api/empresas/${id}/collaborators`)
      setCollaborators(data.collaborators || [])
    } catch { setError('Erro ao carregar colaboradores') }
    setLoading(false)
  }, [])

  const loadFolders = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const data = await apiClient<{ folders: Folder[] }>(`/api/empresas/${id}/folders`)
      setFolders(data.folders || [])
    } catch { setError('Erro ao carregar pastas') }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (empresaId) {
      loadClients(empresaId)
      loadCollaborators(empresaId)
      loadFolders(empresaId)
    }
  }, [empresaId, loadClients, loadCollaborators, loadFolders])

  const handleCreateClient = async () => {
    if (!empresaId) return
    setError('')
    try {
      await apiClient('/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          taxId: form.tax_id || undefined,
          sector: form.sector || undefined,
          empresaId,
        }),
      })
      setShowModal(false)
      setForm({})
      loadClients(empresaId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar cliente')
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Eliminar este cliente?')) return
    try {
      await apiClient(`/api/clients/${id}`, { method: 'DELETE' })
      if (empresaId) loadClients(empresaId)
    } catch { setError('Erro ao eliminar cliente') }
  }

  const buildFolderTree = (parentId: string | null): Folder[] => {
    return folders
      .filter(f => f.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  const renderFolderTree = (parentId: string | null, depth: number = 0): React.ReactNode => {
    const children = buildFolderTree(parentId)
    return children.map(folder => (
      <div key={folder.id} style={{ marginLeft: depth * 20 }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ opacity: 0.6 }}>{folder.folder_type === 'empresa_root' ? '🏢' : folder.folder_type === 'cliente_root' ? '📁' : '📂'}</span>
          <span>{folder.name}</span>
          <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 'auto' }}>{folder.folder_type}</span>
        </div>
        {renderFolderTree(folder.id, depth + 1)}
      </div>
    ))
  }

  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Acesso restrito a Admin da Empresa.</div>
  }

  if (!empresaId && user.role === 'admin') {
    return <div style={{ padding: 40, textAlign: 'center' }}>A sua conta não está associada a nenhuma empresa. Contacte o SuperAdmin.</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Painel da Empresa</h1>
          <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.2)', color: '#86efac' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, opacity: 0.7 }}>{user.name}</span>
          <button onClick={logout} style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#e2e8f0', cursor: 'pointer' }}>Sair</button>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {([
          ['overview', 'Resumo'],
          ['clients', 'Clientes'],
          ['collaborators', 'Colaboradores'],
          ['folders', 'Pastas'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '12px 20px', border: 'none',
            borderBottom: tab === key ? '2px solid #22c55e' : '2px solid transparent',
            background: 'transparent',
            color: tab === key ? '#86efac' : '#94a3b8',
            cursor: 'pointer', fontWeight: tab === key ? 600 : 400,
          }}>{label}</button>
        ))}
      </nav>

      {error && <div style={{ padding: '12px 24px', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 13 }}>{error}</div>}

      <main style={{ padding: '24px' }}>
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 12, background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 13, opacity: 0.6, margin: '0 0 8px 0' }}>Clientes</p>
              <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{clients.length}</p>
            </div>
            <div style={{ padding: 20, borderRadius: 12, background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 13, opacity: 0.6, margin: '0 0 8px 0' }}>Colaboradores</p>
              <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{collaborators.length}</p>
            </div>
            <div style={{ padding: 20, borderRadius: 12, background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 13, opacity: 0.6, margin: '0 0 8px 0' }}>Pastas</p>
              <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{folders.length}</p>
            </div>
          </div>
        )}

        {tab === 'clients' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Clientes ({clients.length})</h2>
              <button onClick={() => { setShowModal(true); setForm({}); setError('') }} style={btnPrimary}>+ Novo Cliente</button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {clients.map(c => (
                <div key={c.id} style={{ padding: 12, borderRadius: 10, background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{c.name}</strong>
                    <span style={{ fontSize: 12, opacity: 0.5, marginLeft: 8 }}>{c.email || 'Sem email'} · {c.sector || 'Sem sector'}</span>
                  </div>
                  <button onClick={() => handleDeleteClient(c.id)} style={btnDanger}>Eliminar</button>
                </div>
              ))}
              {!loading && clients.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', padding: 20 }}>Nenhum cliente. Crie o primeiro.</p>}
            </div>
          </div>
        )}

        {tab === 'collaborators' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Colaboradores ({collaborators.length})</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {collaborators.map(c => (
                <div key={c.id} style={{ padding: 12, borderRadius: 10, background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{c.name}</strong>
                      <span style={{ fontSize: 12, opacity: 0.5, marginLeft: 8 }}>{c.email}</span>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.2)', color: '#86efac' }}>{c.role}</span>
                  </div>
                  <p style={{ fontSize: 12, opacity: 0.5, margin: '4px 0 0 0' }}>
                    {c.department || 'Sem departamento'} · {c.job_position || 'Sem cargo'} · {c.phone || 'Sem telefone'}
                  </p>
                </div>
              ))}
              {!loading && collaborators.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', padding: 20 }}>Nenhum colaborador.</p>}
            </div>
          </div>
        )}

        {tab === 'folders' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Estrutura de Pastas</h2>
            <div style={{ borderRadius: 12, background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {folders.length === 0 && !loading ? (
                <p style={{ opacity: 0.5, textAlign: 'center', padding: 40 }}>Sem pastas.</p>
              ) : (
                renderFolderTree(null)
              )}
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, width: '90%', maxWidth: 500, border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Novo Cliente</h3>
            {error && <p style={{ color: '#fca5a5', fontSize: 13 }}>{error}</p>}
            <div style={{ display: 'grid', gap: 12 }}>
              <input style={inputStyle} placeholder="Nome *" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input style={inputStyle} placeholder="Email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input style={inputStyle} placeholder="Telefone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input style={inputStyle} placeholder="NIF / Tax ID" value={form.tax_id || ''} onChange={e => setForm({ ...form, tax_id: e.target.value })} />
              <input style={inputStyle} placeholder="Setor" value={form.sector || ''} onChange={e => setForm({ ...form, sector: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={btnGhost}>Cancelar</button>
              <button onClick={handleCreateClient} style={btnPrimary}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
}
const btnGhost: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', fontSize: 13,
}
const btnDanger: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', cursor: 'pointer', fontSize: 13,
}
const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#e2e8f0', fontSize: 14, width: '100%', boxSizing: 'border-box',
}
