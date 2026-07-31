import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

const TIERS = [
  {
    icon: 'fa-handshake-angle',
    title: 'Parceiros de implementação',
    desc: 'Integradores e consultoras que ajudam clientes a configurar e adotar o ManuGent com sucesso.',
  },
  {
    icon: 'fa-plug-circle-bolt',
    title: 'Parceiros de tecnologia',
    desc: 'Fabricantes de sensores, ERPs e plataformas IoT que integram com a API do ManuGent.',
  },
  {
    icon: 'fa-bullhorn',
    title: 'Parceiros de revenda',
    desc: 'Empresas que representam o ManuGent junto de novos clientes em diferentes mercados.',
  },
]

export function PartnersPage() {
  return (
    <StaticPageLayout
      badge="Parceiros"
      title="Cresce connosco"
      desc="Construímos o programa de parceiros do ManuGent para integradores, fabricantes de tecnologia e revendedores que partilham a nossa visão para a manutenção industrial."
      narrow={false}
    >
      <div className="static-card-grid">
        {TIERS.map(t => (
          <div className="static-card" key={t.title}>
            <div className="static-card-icon"><i className={`fas ${t.icon}`} /></div>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
          </div>
        ))}
      </div>

      <h2>Porquê ser parceiro ManuGent</h2>
      <ul>
        <li>Acesso antecipado a novas funcionalidades e à API.</li>
        <li>Formação técnica e materiais de vendas dedicados.</li>
        <li>Suporte prioritário de uma equipa dedicada a parceiros.</li>
        <li>Comissões competitivas e programas de co-marketing.</li>
      </ul>

      <h2>Torna-te parceiro</h2>
      <p>
        Se a tua empresa tem interesse em juntar-se ao programa de parceiros, envia-nos os detalhes através
        da <Link to="/contacto" className="static-inline-link">página de contacto</Link> e a nossa equipa
        entra em contacto contigo.
      </p>
    </StaticPageLayout>
  )
}
