const MOCK_PRESETS = [
  { id: '1', name: 'Preventiva Semanal', desc: 'Checklist base para manutenção preventiva semanal de equipamentos rotativos.', icon: 'fas fa-sync-alt', type: 'preventive', tags: ['Rotativos', 'Checklist', 'Semanal'] },
  { id: '2', name: 'Inspeção Elétrica', desc: 'Template de inspeção de quadros elétricos com medições de tensão e corrente.', icon: 'fas fa-bolt', type: 'inspection', tags: ['Elétrico', 'Medições', 'Segurança'] },
  { id: '3', name: 'Ronda AVAC', desc: 'Ronda de verificação de sistemas AVAC com registo de temperaturas e pressões.', icon: 'fas fa-temperature-high', type: 'round', tags: ['AVAC', 'Temperatura', 'Pressão'] },
  { id: '4', name: 'Checklist Segurança', desc: 'Verificação de equipamentos de segurança: extintores, sprinklers, saídas de emergência.', icon: 'fas fa-shield-alt', type: 'checklist', tags: ['Segurança', 'Legal', 'Obrigatório'] },
  { id: '5', name: 'Corretiva Standard', desc: 'Template para abertura de OT corretiva com diagnóstico inicial e recursos necessários.', icon: 'fas fa-tools', type: 'corrective', tags: ['Corretiva', 'Diagnóstico', 'Standard'] },
  { id: '6', name: 'Relatório Intervenção', desc: 'Modelo de relatório de intervenção com ações, recomendações e tempo gasto.', icon: 'fas fa-file-alt', type: 'report', tags: ['Relatório', 'Fecho', 'Cliente'] },
]

export function PresetsPage() {
  return (
    <div className="page-stack animate-fade-in">
      <div className="page-header">
        <p className="eyebrow">Configuração</p>
        <h1 className="page-title">Presets & Templates</h1>
        <p className="page-subtitle">Modelos pré-configurados para acelerar a criação de OTs, inspeções e relatórios.</p>
      </div>

      <div className="presets-toolbar">
        <input className="glass-input" placeholder="Pesquisar presets..." style={{ maxWidth: 320 }} />
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary"><i className="fas fa-filter" /> Filtrar</button>
        <button className="btn btn-primary"><i className="fas fa-plus" /> Novo Preset</button>
      </div>

      <div className="presets-grid">
        {MOCK_PRESETS.map((preset, i) => (
          <article key={preset.id} className={`glass-card glass-card-interactive preset-card animate-fade-in-up stagger-${i + 1}`}>
            <div className="preset-card-header">
              <i className={`${preset.icon} preset-card-icon`} />
              <div className="preset-card-name">{preset.name}</div>
            </div>
            <div className="preset-card-info">{preset.desc}</div>
            <div className="preset-card-tags">
              {preset.tags.map((tag) => (
                <span key={tag} className="badge badge-primary">{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
