# TODO: Renomear "Técnico" → "Colaborador" (consumir todos os perfis)

## Etapas

### 1. public/app/index.html — Dicionário AI
- [x] Adicionar `{ word: 'colaborador', module: 'technicians', label: 'Criar colaborador' }`
- [x] Adicionar `{ word: 'engenheiro', module: 'technicians', label: 'Criar colaborador' }`
- [x] Adicionar `{ word: 'financeiro', module: 'technicians', label: 'Criar colaborador' }`
- [x] Adicionar `{ word: 'gestor', module: 'technicians', label: 'Criar colaborador' }`

### 2. public/app/index.html — Labels da IA
- [x] `buildAIListResponse('technicians')`: "Técnicos no escopo" → "Colaboradores no escopo"
- [x] `getAIContexts().technicians`: title "Técnicos" → "Colaboradores", actions "Criar técnico" → "Criar colaborador"
- [x] `cleanAIEntityName`: "Técnico criado pela IA" → "Colaborador criado pela IA"
- [x] `buildAICreatePlan`: "Criar técnico" → "Criar colaborador"
- [x] `detectAICommandTarget`: adicionar `colaborador` ao regex

### 3. public/app/index.html — Select de Responsável nas OTs
- [x] `getAssignableCollaborators`: incluir `financeiro` e `gestor`

### 4. public/app/index.html — Sample data
- [x] Adicionar exemplos de engenheiro, financeiro e gestor no `APP.technicians`

### 5. public/app/index.html — Context summary
- [x] "Técnicos visíveis" → "Colaboradores visíveis"

### 6. scripts/seed-demo-data.mjs
- [x] Garantir que `ROLES` inclui `engenheiro` (já tem `financeiro`)

## Sessão 2026-08-02 (b): categoria/empresa/tabela/pastas

- [x] Corrigido bug de migração: `folders`/`documents` nunca ganhavam as colunas
      `empresa_id`/`client_id`/`folder_type` em produção porque uma migração
      anterior usava `CREATE TABLE IF NOT EXISTS` sobre tabelas já existentes
      (no-op). Retrofit via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` na nova
      migração `20260802220000_...sql`.
- [x] Empresa: novo campo `domain` (já existia na API, faltava no modal) e novo
      campo `category` (prestador/cliente/parceiro) — coluna nova + constraint.
- [x] Colaborador: novo select "Empresa" no modal, com validação de domínio de
      email (bloqueia guardar se o email não pertencer ao domínio da empresa
      selecionada). Front-end (APP.technicians) valida contra `/api/empresas`;
      back-end tem RPC `set_user_empresa()` equivalente para a tabela `users`.
- [x] Novos endpoints `POST/DELETE /api/empresas/:id/collaborators/:userId`.
- [x] "Ver Colaboradores" deixou de abrir modal — agora navega para uma página
      com tabela (`page-empresa-colaboradores`) com ações de editar/remover.
- [x] `scripts/seed-demo-data.mjs`: pastas passam a seguir a hierarquia
      Empresa → {Documentos,Contratos,Colaboradores,Clientes/{Cliente}/{...},Outros}
      com `empresa_id`/`client_id`/`folder_type` populados (antes só existia
      `id/name/parent_id/owner_id`, sem ligação a empresa).
- [ ] Não foi possível correr `docker compose up -d db && npm run db:seed`
      neste ambiente (sem Docker disponível na sandbox) — validar localmente.


