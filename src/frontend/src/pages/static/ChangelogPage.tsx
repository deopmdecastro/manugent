import { StaticPageLayout } from '../../components/static/StaticPageLayout'

const ENTRIES = [
  {
    date: 'Julho 2026',
    version: 'v2.0.0',
    items: [
      { tag: 'new', text: 'Novo agente de IA com diagnóstico em tempo real baseado em GPT-4o e Llama 3.' },
      { tag: 'new', text: 'Leitura de ativos por NFC e QR code diretamente na aplicação móvel.' },
      { tag: 'improved', text: 'Dashboard de KPIs redesenhado com MTBF, MTTR, OEE e compliance ao vivo.' },
    ],
  },
  {
    date: 'Abril 2026',
    version: 'v1.6.0',
    items: [
      { tag: 'new', text: 'Modo offline completo (PWA) com sincronização automática ao reconectar.' },
      { tag: 'improved', text: 'Geração de relatórios PDF mais rápida e com novo modelo visual.' },
      { tag: 'fixed', text: 'Corrigido problema de duplicação de notificações em ordens recorrentes.' },
    ],
  },
  {
    date: 'Janeiro 2026',
    version: 'v1.4.0',
    items: [
      { tag: 'new', text: 'Criação automática de ordens de serviço corretivas a partir de medições.' },
      { tag: 'improved', text: 'Desempenho geral da aplicação melhorado em cerca de 30%.' },
    ],
  },
  {
    date: 'Outubro 2025',
    version: 'v1.0.0',
    items: [
      { tag: 'new', text: 'Lançamento público do ManuGent: CMMS, base de conhecimento e gestão de ativos.' },
    ],
  },
]

const TAG_LABEL: Record<string, string> = { new: 'Novo', improved: 'Melhorado', fixed: 'Corrigido' }
const TAG_CLASS: Record<string, string> = {
  new: 'static-changelog-tag-new',
  improved: 'static-changelog-tag-improved',
  fixed: 'static-changelog-tag-fixed',
}

export function ChangelogPage() {
  return (
    <StaticPageLayout
      badge="Changelog"
      title="O que há de novo no ManuGent"
      desc="Todas as novidades, melhorias e correções lançadas na plataforma, por ordem cronológica."
    >
      {ENTRIES.map(entry => (
        <div className="static-changelog-entry" key={entry.version}>
          <div className="static-changelog-date">{entry.date}</div>
          <div>
            <span className="static-changelog-version">{entry.version}</span>
            <ul>
              {entry.items.map((item, i) => (
                <li key={i}>
                  <span className={`static-changelog-tag ${TAG_CLASS[item.tag]}`}>{TAG_LABEL[item.tag]}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </StaticPageLayout>
  )
}
