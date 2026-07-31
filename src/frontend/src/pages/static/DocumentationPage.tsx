import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

const CATEGORIES = [
  {
    icon: 'fa-rocket',
    title: 'Primeiros passos',
    desc: 'Cria a tua conta, configura a organização e convida a equipa em poucos minutos.',
  },
  {
    icon: 'fa-boxes-stacked',
    title: 'Gestão de ativos',
    desc: 'Regista equipamentos, hierarquias e histórico completo de manutenção.',
  },
  {
    icon: 'fa-screwdriver-wrench',
    title: 'Ordens de serviço',
    desc: 'Cria, atribui e acompanha ordens corretivas e preventivas em tempo real.',
  },
  {
    icon: 'fa-robot',
    title: 'Agente de IA',
    desc: 'Como o técnico digital sugere diagnósticos e planos de intervenção.',
  },
  {
    icon: 'fa-qrcode',
    title: 'NFC & QR Codes',
    desc: 'Associa etiquetas físicas aos ativos para leitura instantânea no terreno.',
  },
  {
    icon: 'fa-plug',
    title: 'Integrações & API',
    desc: 'Liga o ManuGent a ERPs, sensores IoT e outras ferramentas da tua stack.',
  },
]

export function DocumentationPage() {
  return (
    <StaticPageLayout
      badge="Documentação"
      title="Tudo o que precisas para tirar partido do ManuGent"
      desc="Guias passo-a-passo, referência técnica e boas práticas para configurar e operar a plataforma."
      narrow={false}
    >
      <div className="static-card-grid">
        {CATEGORIES.map(c => (
          <div className="static-card" key={c.title}>
            <div className="static-card-icon"><i className={`fas ${c.icon}`} /></div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <a href="#" className="static-card-link">Ler guia <i className="fas fa-arrow-right" /></a>
          </div>
        ))}
      </div>

      <h2>Sobre esta documentação</h2>
      <p>
        A documentação do ManuGent está organizada por área funcional para que encontres rapidamente
        o que precisas, quer estejas a configurar a plataforma pela primeira vez, quer estejas à procura
        de um pormenor específico de uma funcionalidade avançada.
      </p>
      <p>
        Se procuras informação sobre integrações programáticas e endpoints, consulta a{' '}
        <Link to="/api" className="static-inline-link">referência da API</Link>. Para acompanhar novidades
        e alterações recentes à plataforma, visita o{' '}
        <Link to="/changelog" className="static-inline-link">changelog</Link>.
      </p>

      <h2>Precisas de ajuda adicional?</h2>
      <p>
        A nossa equipa de suporte está disponível para esclarecer dúvidas técnicas ou ajudar na configuração
        inicial da tua organização.
      </p>
      <Link to="/contacto" className="static-inline-link">Falar com a equipa de suporte →</Link>
    </StaticPageLayout>
  )
}
