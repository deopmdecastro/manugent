# TODO: Tela de Visualizar Incidente (clicar e visualizar)

## Objetivo
Permitir clicar num incidente na tabela de Incidentes e abrir uma tela de detalhe/visualização com todas as informações do incidente.

## Steps

- [x] 1. Adicionar modal de detalhe do incidente (`#modal-incident-detail`) no HTML
- [x] 2. Registrar a página de detalhe em `setupDetailPages()` e `isMobileDetailPage()` — `setupDetailPages()` nunca incluía `modal-incident-detail`, por isso o modal nunca chegava a ficar visível; corrigido.
- [x] 3. Tornar as linhas da tabela de incidentes clicáveis (ícone de olho + clique)
- [x] 4. Adicionar funções `openIncidentDetail()`, `updateIncidentStatus()`, `closeIncidentDetail()` — estavam referenciadas no HTML mas nunca implementadas (bug: `ReferenceError` ao clicar numa linha ou mudar o estado)
- [ ] 5. Atualizar handler de notificações de incidente para abrir o detalhe — fora do âmbito desta iteração
- [x] 6. Adicionar CSS da página de detalhe do incidente (reutiliza `.detail-page`/`.card` já existentes)
- [x] 7. Validar sintaxe (`node --check` ao bloco de script + `tsc --noEmit` + `npm run build`)

## Extra (pedido adicional do utilizador)

- [x] Botões de ação por linha: ver, editar, apagar, marcar como resolvido
- [x] Associação de incidentes a Cliente e Empresa (via `clients.empresa_id`), com colunas na tabela e no detalhe
- [x] Modal de resolução (`#modal-resolve-incident`) ao marcar como resolvido, com campo de notas de resolução
- [x] ID abreviado com "…" na tabela e no detalhe (tooltip com o ID completo)
- [x] Backend: `POST /api/incidents`, `PATCH /api/incidents/:id`, `DELETE /api/incidents/:id`
- [x] Migração: `incidents.resolution_notes`, `incidents.resolved_by`, tipo `outro` para incidentes criados pela UI
