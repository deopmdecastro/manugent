import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

const ENDPOINTS = [
  { method: 'GET', path: '/v1/assets', desc: 'Lista os ativos da organização' },
  { method: 'POST', path: '/v1/assets', desc: 'Regista um novo ativo' },
  { method: 'GET', path: '/v1/work-orders', desc: 'Lista ordens de serviço' },
  { method: 'POST', path: '/v1/work-orders', desc: 'Cria uma nova ordem de serviço' },
  { method: 'PATCH', path: '/v1/work-orders/{id}', desc: 'Atualiza o estado de uma ordem' },
  { method: 'GET', path: '/v1/kpis', desc: 'Obtém MTBF, MTTR, OEE e compliance' },
  { method: 'DELETE', path: '/v1/assets/{id}', desc: 'Remove um ativo' },
]

const METHOD_CLASS: Record<string, string> = {
  GET: 'static-api-method-get',
  POST: 'static-api-method-post',
  PATCH: 'static-api-method-patch',
  DELETE: 'static-api-method-delete',
}

export function ApiPage() {
  return (
    <StaticPageLayout
      badge="API"
      title="API REST do ManuGent"
      desc="Integra o ManuGent com o teu ERP, sensores IoT ou ferramentas internas através de uma API REST simples e previsível."
    >
      <h2>Autenticação</h2>
      <p>
        Todos os pedidos são autenticados através de uma chave de API pessoal ou de organização, enviada
        no cabeçalho <code>Authorization</code>. Podes gerar e revogar chaves nas definições da tua conta.
      </p>
      <div className="static-code-block">{`curl https://api.manugent.pt/v1/assets \\
  -H "Authorization: Bearer SUA_CHAVE_API"`}</div>

      <h2>Endpoints principais</h2>
      <table className="static-api-table">
        <thead>
          <tr>
            <th>Método</th>
            <th>Endpoint</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          {ENDPOINTS.map(e => (
            <tr key={e.method + e.path}>
              <td><span className={`static-api-method ${METHOD_CLASS[e.method]}`}>{e.method}</span></td>
              <td><span className="static-api-path">{e.path}</span></td>
              <td>{e.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Limites de utilização</h2>
      <p>
        A API está sujeita a um limite de 120 pedidos por minuto por chave de API. Se precisares de um
        limite mais elevado para a tua integração, contacta a equipa comercial.
      </p>

      <h2>Guias relacionados</h2>
      <p>
        Consulta a <Link to="/documentacao" className="static-inline-link">documentação geral</Link> para
        um contexto mais alargado sobre os conceitos usados na API, ou o{' '}
        <Link to="/changelog" className="static-inline-link">changelog</Link> para acompanhar novas versões.
      </p>
    </StaticPageLayout>
  )
}
