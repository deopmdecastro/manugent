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

