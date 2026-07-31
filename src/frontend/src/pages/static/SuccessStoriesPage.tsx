import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

const STORIES = [
  {
    logo: 'IF',
    company: 'Indústrias Ferreira',
    sector: 'Produção metalomecânica',
    quote: 'Reduzimos o tempo médio de paragem em 34% no primeiro trimestre depois de adotarmos o ManuGent.',
    stats: [
      { value: '−34%', label: 'Tempo de paragem' },
      { value: '+28%', label: 'OEE' },
    ],
  },
  {
    logo: 'LN',
    company: 'Lacticínios do Norte',
    sector: 'Indústria alimentar',
    quote: 'O agente de IA passou a sugerir a causa provável de cada avaria antes de o técnico chegar ao equipamento.',
    stats: [
      { value: '−41%', label: 'MTTR' },
      { value: '3x', label: 'Ordens resolvidas à primeira' },
    ],
  },
  {
    logo: 'PQ',
    company: 'Papeleira do Vouga',
    sector: 'Papel e celulose',
    quote: 'Deixámos de perder histórico de manutenção quando um técnico muda de equipa. Está tudo centralizado.',
    stats: [
      { value: '100%', label: 'Ativos digitalizados' },
      { value: '−22%', label: 'Custos de manutenção' },
    ],
  },
  {
    logo: 'TX',
    company: 'Têxteis Almeida',
    sector: 'Têxtil',
    quote: 'A leitura de ativos por QR code tornou a inspeção diária muito mais rápida e fiável.',
    stats: [
      { value: '5 min', label: 'Por inspeção de ativo' },
      { value: '+19%', label: 'Cumprimento do plano preventivo' },
    ],
  },
]

export function SuccessStoriesPage() {
  return (
    <StaticPageLayout
      badge="Casos de sucesso"
      title="Equipas que já transformaram a sua manutenção"
      desc="Histórias reais de empresas que usam o ManuGent para reduzir paragens, organizar equipas e tomar decisões com dados."
      narrow={false}
    >
      <div className="static-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {STORIES.map(s => (
          <div className="static-card" key={s.company}>
            <div className="static-card-icon" style={{ borderRadius: '50%', fontWeight: 800, fontSize: '15px' }}>
              {s.logo}
            </div>
            <h3>{s.company}</h3>
            <p style={{ marginBottom: '14px' }}>{s.sector}</p>
            <p style={{ fontStyle: 'italic' }}>&ldquo;{s.quote}&rdquo;</p>
            <div style={{ display: 'flex', gap: '24px', marginTop: '18px' }}>
              {s.stats.map(stat => (
                <div key={stat.label}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--l-accent-light)' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--l-text-muted)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2>Queres ser o próximo caso de sucesso?</h2>
      <p>
        Fala com a nossa equipa e descobre como o ManuGent se pode adaptar à realidade da tua indústria.
        Podes também consultar a <Link to="/documentacao" className="static-inline-link">documentação</Link>{' '}
        para perceber melhor como funciona a plataforma.
      </p>
      <Link to="/contacto" className="static-inline-link">Agendar uma demonstração →</Link>
    </StaticPageLayout>
  )
}
