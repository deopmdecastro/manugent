import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

export function CookiesPage() {
  return (
    <StaticPageLayout
      badge="Legal"
      title="Política de Cookies"
      desc="Como o ManuGent utiliza cookies e tecnologias semelhantes no website e na plataforma."
    >
      <span className="static-content-updated">Última atualização: julho de 2026</span>

      <h2>O que são cookies</h2>
      <p>
        Cookies são pequenos ficheiros de texto guardados no teu dispositivo quando visitas um website.
        Permitem-nos reconhecer o teu dispositivo e guardar algumas informações sobre as tuas preferências
        ou ações anteriores.
      </p>

      <h2>Tipos de cookies que utilizamos</h2>
      <ul>
        <li>
          <strong>Cookies essenciais</strong> — necessários para o funcionamento básico do website e da
          plataforma, como manter a tua sessão iniciada.
        </li>
        <li>
          <strong>Cookies de preferências</strong> — guardam escolhas como o tema (claro/escuro) e o idioma
          selecionado.
        </li>
        <li>
          <strong>Cookies analíticos</strong> — ajudam-nos a perceber como o website é utilizado, para que
          possamos melhorá-lo continuamente.
        </li>
      </ul>

      <h2>Como gerir cookies</h2>
      <p>
        Podes gerir ou desativar cookies através das definições do teu navegador. Nota que desativar
        cookies essenciais pode afetar o funcionamento correto da plataforma.
      </p>

      <h2>Mais informação</h2>
      <p>
        Para mais detalhes sobre como tratamos os teus dados pessoais, consulta a nossa{' '}
        <Link to="/privacidade" className="static-inline-link">Política de Privacidade</Link>. Para
        questões específicas sobre cookies,{' '}
        <Link to="/contacto" className="static-inline-link">contacta-nos</Link>.
      </p>
    </StaticPageLayout>
  )
}
