import { MetricCard } from '../components/ui/MetricCard'

export function DashboardPage() {
  return (
    <div className="page-stack">
      <div>
        <p className="eyebrow">Operação</p>
        <h1>Visão geral</h1>
        <p className="page-subtitle">Base React modular preparada para migrar os módulos da plataforma com segurança.</p>
      </div>
      <div className="metrics-grid">
        <MetricCard label="Arquitetura" value="React" icon="fas fa-layer-group" />
        <MetricCard label="Estado" value="Incremental" icon="fas fa-code-branch" />
        <MetricCard label="Layout" value="Responsivo" icon="fas fa-mobile-screen" />
        <MetricCard label="Sidebar" value="Persistente" icon="fas fa-table-columns" />
      </div>
    </div>
  )
}
