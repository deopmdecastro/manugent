const MOCK_PROJECTS = [
  { id: '1', name: 'Manutenção Preventiva Q3', desc: 'Plano trimestral de preventivas para todos os equipamentos críticos da linha 1.', icon: 'fas fa-calendar-check', status: 'active', equipments: 24, ots: 8 },
  { id: '2', name: 'Upgrade AVAC Edifício A', desc: 'Substituição de chillers e instalação de novos controladores de temperatura.', icon: 'fas fa-wind', status: 'in_progress', equipments: 6, ots: 3 },
  { id: '3', name: 'Certificação ISO 55000', desc: 'Preparação de documentação e auditoria para certificação de gestão de ativos.', icon: 'fas fa-certificate', status: 'pending', equipments: 42, ots: 0 },
  { id: '4', name: 'Automação de Inspeções', desc: 'Digitalização de rondas de inspeção com QR codes e NFC.', icon: 'fas fa-qrcode', status: 'active', equipments: 18, ots: 5 },
  { id: '5', name: 'Análise Preditiva Motores', desc: 'Implementação de sensores IoT para monitorização de vibração e temperatura.', icon: 'fas fa-microchip', status: 'planning', equipments: 12, ots: 0 },
  { id: '6', name: 'Expansão Planta Norte', desc: 'Setup de CMMS para nova unidade fabril com 50+ equipamentos.', icon: 'fas fa-industry', status: 'planning', equipments: 55, ots: 0 },
]

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'badge-success' },
  in_progress: { label: 'Em Progresso', className: 'badge-primary' },
  pending: { label: 'Pendente', className: 'badge-warning' },
  planning: { label: 'Planeamento', className: 'badge-warning' },
}

export function ProjectsPage() {
  return (
    <div className="page-stack animate-fade-in">
      <div className="page-header">
        <p className="eyebrow">Gestão</p>
        <h1 className="page-title">Projetos</h1>
        <p className="page-subtitle">Gere projetos de manutenção e acompanhe o progresso de cada iniciativa.</p>
      </div>

      <div className="projects-toolbar">
        <input className="glass-input" placeholder="Pesquisar projetos..." style={{ maxWidth: 320 }} />
        <div className="topbar-spacer" style={{ flex: 1 }} />
        <button className="btn btn-secondary">
          <i className="fas fa-filter" /> Filtrar
        </button>
        <button className="btn btn-primary">
          <i className="fas fa-plus" /> Novo Projeto
        </button>
      </div>

      <div className="projects-grid">
        {MOCK_PROJECTS.map((project, i) => {
          const status = STATUS_MAP[project.status]
          return (
            <article key={project.id} className={`glass-card glass-card-interactive project-card animate-fade-in-up stagger-${i + 1}`}>
              <div className="project-card-header">
                <div className="project-card-icon">
                  <i className={project.icon} />
                </div>
                <span className={`badge ${status.className}`}>{status.label}</span>
              </div>
              <div className="project-card-title">{project.name}</div>
              <div className="project-card-desc">{project.desc}</div>
              <div className="project-card-meta">
                <span><i className="fas fa-microchip" style={{ marginRight: 4 }} />{project.equipments} equip.</span>
                <span><i className="fas fa-wrench" style={{ marginRight: 4 }} />{project.ots} OTs</span>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
