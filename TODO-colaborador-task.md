# TODO: Renomear "Técnico" → "Colaborador" (consumir todos os perfis)

## Etapas

### 1. public/app/index.html — Dicionário AI
- [x] Adicionar `{ word: 'colaborador', module: 'technicians', label: 'Criar colaborador' }`
- [x] Adicionar `{ word: 'engenheiro', module: 'technicians', label: 'Criar colaborador' }`
- [x] Adicionar `{ word: 'financeiro', module: 'technicians', label: 'Criar colaborador' }`
- [x] Adicionar `{ word: 'gestor', module: 'technicians', label: 'Criar colaborador' }`

### 2. public/app/index.html — Labels da IA
- [ ] `buildAIListResponse('technicians')`: "Técnicos no escopo" → "Colaboradores no escopo"
- [ ] `getAIContexts().technicians`: title "Técnicos" → "Colaboradores", actions "Criar técnico" → "Criar colaborador"
- [ ] `cleanAIEntityName`: "Técnico criado pela IA" → "Colaborador criado pela IA"
- [ ] `buildAICreatePlan`: "Criar técnico" → "Criar colaborador"
- [ ] `detectAICommandTarget`: adicionar `colaborador` ao regex

### 3. public/app/index.html — Select de Responsável nas OTs
- [ ] `getAssignableCollaborators`: incluir `financeiro` e `gestor`

### 4. public/app/index.html — Sample data
- [ ] Adicionar exemplos de engenheiro, financeiro e gestor no `APP.technicians`

### 5. public/app/index.html — Context summary
- [ ] "Técnicos visíveis" → "Colaboradores visíveis"

### 6. scripts/seed-demo-data.mjs
- [ ] Garantir que `ROLES` inclui `engenheiro` (já tem `financeiro`)

