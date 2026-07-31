import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

export function PrivacyPage() {
  return (
    <StaticPageLayout
      badge="Legal"
      title="Política de Privacidade"
      desc="Como recolhemos, usamos e protegemos os teus dados pessoais na plataforma ManuGent."
    >
      <span className="static-content-updated">Última atualização: julho de 2026</span>

      <h2>1. Quem somos</h2>
      <p>
        O ManuGent é uma plataforma de gestão de manutenção industrial (CMMS). Esta política descreve como
        tratamos os dados pessoais dos utilizadores da plataforma e dos visitantes do nosso website,
        em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).
      </p>

      <h2>2. Dados que recolhemos</h2>
      <p>Podemos recolher os seguintes tipos de dados:</p>
      <ul>
        <li>Dados de identificação e contacto (nome, email, empresa, função).</li>
        <li>Dados de acesso à plataforma (registos de sessão, endereço IP, tipo de dispositivo).</li>
        <li>Conteúdo introduzido na plataforma (ordens de serviço, ativos, comentários).</li>
        <li>Dados de comunicação, quando entras em contacto com a nossa equipa de suporte.</li>
      </ul>

      <h2>3. Como usamos os dados</h2>
      <p>Utilizamos os dados recolhidos para:</p>
      <ul>
        <li>Disponibilizar e melhorar a plataforma e as suas funcionalidades.</li>
        <li>Personalizar a experiência do agente de inteligência artificial.</li>
        <li>Comunicar contigo sobre a tua conta ou sobre novidades relevantes.</li>
        <li>Garantir a segurança e prevenir utilização indevida da plataforma.</li>
        <li>Cumprir obrigações legais e contratuais.</li>
      </ul>

      <h2>4. Partilha de dados</h2>
      <p>
        Não vendemos dados pessoais a terceiros. Podemos partilhar dados com fornecedores que nos ajudam a
        operar a plataforma (por exemplo, alojamento e envio de emails), sempre sujeitos a acordos de
        confidencialidade e proteção de dados adequados.
      </p>

      <h2>5. Os teus direitos</h2>
      <p>
        Podes exercer os teus direitos de acesso, retificação, apagamento, portabilidade e oposição ao
        tratamento dos teus dados a qualquer momento. Consulta a nossa{' '}
        <Link to="/gdpr" className="static-inline-link">página de RGPD</Link> para mais detalhes ou{' '}
        <Link to="/contacto" className="static-inline-link">contacta-nos</Link> diretamente.
      </p>

      <h2>6. Retenção de dados</h2>
      <p>
        Conservamos os dados apenas durante o tempo necessário para os fins para os quais foram recolhidos,
        ou conforme exigido por lei.
      </p>

      <h2>7. Alterações a esta política</h2>
      <p>
        Podemos atualizar esta política periodicamente. Notificaremos alterações significativas através da
        plataforma ou por email.
      </p>
    </StaticPageLayout>
  )
}
