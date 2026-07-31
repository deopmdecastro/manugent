import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

export function TermsPage() {
  return (
    <StaticPageLayout
      badge="Legal"
      title="Termos e Condições"
      desc="As regras que regem a utilização da plataforma ManuGent."
    >
      <span className="static-content-updated">Última atualização: julho de 2026</span>

      <h2>1. Aceitação dos termos</h2>
      <p>
        Ao criar uma conta ou utilizar a plataforma ManuGent, aceitas estes termos e condições na
        totalidade. Se não concordares com algum ponto, não deves utilizar a plataforma.
      </p>

      <h2>2. Descrição do serviço</h2>
      <p>
        O ManuGent disponibiliza uma plataforma de gestão de manutenção industrial (CMMS), incluindo gestão
        de ativos, ordens de serviço, indicadores de desempenho e um agente de inteligência artificial de
        apoio à decisão técnica.
      </p>

      <h2>3. Contas e acesso</h2>
      <ul>
        <li>És responsável por manter a confidencialidade das tuas credenciais de acesso.</li>
        <li>O acesso à plataforma é normalmente concedido pelo administrador da tua organização.</li>
        <li>Reservamo-nos o direito de suspender contas em caso de utilização indevida.</li>
      </ul>

      <h2>4. Utilização aceitável</h2>
      <p>
        Comprometes-te a não utilizar a plataforma para fins ilegais, a não tentar aceder indevidamente a
        dados de outras organizações e a não interferir com a segurança ou o normal funcionamento do
        serviço.
      </p>

      <h2>5. Planos e pagamentos</h2>
      <p>
        Os detalhes de cada plano, incluindo preços e funcionalidades incluídas, estão disponíveis na
        página de preços. Os pagamentos são processados de acordo com o plano contratado e podem estar
        sujeitos a alterações mediante aviso prévio.
      </p>

      <h2>6. Propriedade intelectual</h2>
      <p>
        A plataforma ManuGent, incluindo o seu código, design e marca, é propriedade do ManuGent. Os dados
        que a tua organização insere na plataforma continuam a ser propriedade da tua organização.
      </p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>
        O ManuGent esforça-se por garantir a disponibilidade e fiabilidade da plataforma, mas não garante
        um serviço isento de interrupções. Consulta o nosso acordo de nível de serviço para mais detalhes.
      </p>

      <h2>8. Alterações aos termos</h2>
      <p>
        Podemos atualizar estes termos periodicamente. Notificaremos alterações significativas através da
        plataforma ou por email. Para questões sobre estes termos,{' '}
        <Link to="/contacto" className="static-inline-link">contacta a nossa equipa</Link>.
      </p>
    </StaticPageLayout>
  )
}
