import { MetricCard } from '../components/ui/MetricCard'

export function DashboardPage() {
  return (
    <div className="page-stack animate-fade-in">
      <div className="page-header">
        <p className="eyebrow">Operação</p>
        <h1 className="page-title">Visão geral</h1>
        <p className="page-subtitle">Indicadores de manutenção em tempo real — ManuGent IA ativo.</p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="OTs Abertas"
          value={12}
          icon="fas fa-wrench"
          trend={{ value: 8, label: 'esta semana' }}
        />
        <MetricCard
          label="Em Progresso"
          value={5}
          icon="fas fa-spinner"
          trend={{ value: -2, label: 'vs ontem' }}
        />
        <MetricCard
          label="Equipamentos"
          value={247}
          icon="fas fa-microchip"
        />
        <MetricCard
          label="Conformidade"
          value="94%"
          icon="fas fa-check-circle"
          trend={{ value: 3, label: 'este mês' }}
        />
      </div>

      {/* Recent activity section */}
      <div className="glass-card" style={{ padding: 24, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Atividade Recente</h3>
          <button className="btn btn-ghost" style={{ fontSize: 13 }}>
            Ver todas <i className="fas fa-arrow-right" style={{ marginLeft: 4 }} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: 'fas fa-check-circle', color: 'var(--accent-green)', text: 'OT #1042 — Preventiva concluída: Compressor A3', time: '10 min atrás' },
            { icon: 'fas fa-exclamation-triangle', color: 'var(--accent-yellow)', text: 'OT #1043 — Medição fora dos limites: Vibração 8.2 mm/s', time: '28 min atrás' },
            { icon: 'fas fa-plus-circle', color: 'var(--accent)', text: 'OT #1044 — Nova OT corretiva criada automaticamente', time: '45 min atrás' },
            { icon: 'fas fa-file-pdf', color: 'var(--accent-cyan)', text: 'Relatório de intervenção gerado: Cliente Demo', time: '1 h atrás' },
            { icon: 'fas fa-user-check', color: 'var(--accent-purple)', text: 'Técnico Demo juntou-se à OT #1042', time: '2 h atrás' },
          ].map((item, i) => (
            <div
              key={i}
              className="animate-fade-in-up"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 'var(--radius)',
                background: 'rgba(99,102,241,0.04)', transition: 'background 0.2s ease',
                animationDelay: `${0.3 + i * 0.05}s`,
              }}
            >
              <i className={item.icon} style={{ color: item.color, fontSize: 18, width: 22, textAlign: 'center' }} />
              <span style={{ flex: 1, fontSize: 14 }}>{item.text}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
