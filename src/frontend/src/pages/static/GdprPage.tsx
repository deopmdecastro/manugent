import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

const RIGHTS = [
  { icon: 'fa-eye', title: 'Direito de acesso', desc: 'Podes pedir uma cópia dos dados pessoais que temos sobre ti.' },
  { icon: 'fa-pen', title: 'Direito de retificação', desc: 'Podes corrigir dados incompletos ou incorretos.' },
  { icon: 'fa-trash', title: 'Direito ao apagamento', desc: 'Podes pedir a eliminação dos teus dados, salvo obrigações legais de retenção.' },
  { icon: 'fa-file-export', title: 'Direito à portabilidade', desc: 'Podes solicitar os teus dados num formato estruturado e legível.' },
  { icon: 'fa-hand', title: 'Direito de oposição', desc: 'Podes opor-te a determinados tratamentos dos teus dados.' },
  { icon: 'fa-ban', title: 'Direito à limitação', desc: 'Podes pedir a limitação do tratamento em certas circunstâncias.' },
]

export function GdprPage() {
  return (
    <StaticPageLayout
      badge="Legal"
      title="RGPD"
      desc="O ManuGent está comprometido com o cumprimento do Regulamento Geral sobre a Proteção de Dados."
      narrow={false}
    >
      <h2>O nosso compromisso</h2>
      <p>
        Tratamos os dados pessoais com base nos princípios do RGPD: licitude, transparência, minimização
        de dados, limitação da finalidade, exatidão, limitação da conservação e integridade. Para mais
        detalhes sobre que dados recolhemos e porquê, consulta a nossa{' '}
        <Link to="/privacidade" className="static-inline-link">Política de Privacidade</Link>.
      </p>

      <h2>Os teus direitos ao abrigo do RGPD</h2>
      <div className="static-card-grid">
        {RIGHTS.map(r => (
          <div className="static-card" key={r.title}>
            <div className="static-card-icon"><i className={`fas ${r.icon}`} /></div>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
          </div>
        ))}
      </div>

      <h2>Encarregado de proteção de dados</h2>
      <p>
        Se tiveres dúvidas sobre como tratamos os teus dados ou quiseres exercer algum dos direitos acima,
        podes contactar o nosso encarregado de proteção de dados através de{' '}
        <Link to="/contacto" className="static-inline-link">geral@manugent.pt</Link>.
      </p>

      <h2>Autoridade de controlo</h2>
      <p>
        Se considerares que o tratamento dos teus dados pessoais viola o RGPD, tens o direito de apresentar
        reclamação junto da Comissão Nacional de Proteção de Dados (CNPD), a autoridade de controlo
        competente em Portugal.
      </p>
    </StaticPageLayout>
  )
}
