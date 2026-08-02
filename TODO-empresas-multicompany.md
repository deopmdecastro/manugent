# TODO: Empresas (Multi-company) + Colaboradores por Empresa + Edifícios + Seeds

## Objectivo
Implementar o conceito de **Empresas** na plataforma ManuGent:
- Colaboradores associados a uma empresa; só o gestor/admin dessa empresa vê e atribui trabalho aos seus colaboradores
- Nova aba **Empresas** visível apenas para superadmin (gere e filtra tudo por empresa)
- Edifícios associados aos clientes (criar/associar)
- Seed das empresas + credenciais + distribuição de colaboradores
- Seeds para: conhecimento, material, compras, orçamentos, incidentes, calendários, checklist, ficheiros (pasta/subpastas por cliente)

## Etapas

### 1. Schema SQL
- [x] Criar `docker/postgres/init/007_companies_and_relations.sql`
  - Tabela `companies` (id, name, tax_id, email, phone, address, city, sector, active, created_at)
  - `users.company_id` FK → companies
  - `clients.company_id` FK → companies
  - Índices
  - RPC: `get_companies()`, `get_users_with_company()`, `get_company_collaborators(p_company_id)`
- [x] Criar espelho Supabase `supabase/migrations/20260803120000_companies_and_relations.sql`

### 2. Seed `scripts/seed-demo-data.mjs`
- [ ] Adicionar `companies` (5-6 empresas demo com emails/credenciais)
- [ ] `company_id` nos utilizadores (distribuir colaboradores por empresa)
- [ ] `company_id` nos clientes (empresa-cliente)
- [ ] Associação edifícios → clientes já existente; garantir visão por empresa
- [ ] Seeds por empresa para conhecimento, material, compras, orçamentos, incidentes, calendário, checklists, ficheiros/pastas

### 3. Backend `src/server.ts`
- [ ] `GET/POST /api/companies` (superadmin)
- [ ] `GET /api/companies/:id/collaborators`
- [ ] `GET /api/users` — filtrar por empresa para gestor/admin; superadmin vê tudo
- [ ] Login devolve `company_id`/`company_name`
- [ ] `GET /api/clients`, `/api/buildings`, `/api/equipment` — filtro opcional por empresa

### 4. Legacy SPA `public/app/index.html`
- [ ] `APP.companies` no estado local
- [ ] Nav "Empresas" (só superadmin) na sidebar
- [ ] Página `page-empresas` + `renderCompanies()`
- [ ] `showPage('empresas')` + `PAGE_PERMISSIONS` + `applyPermissions`
- [ ] Colaboradores: filtrar por empresa do gestor/admin; mostrar empresa no cartão
- [ ] Clientes/Edifícios: filtro por empresa
- [ ] `syncBackendWorkOrders` carrega `/api/companies` e integra

### 5. React (auth bridge)
- [ ] `useAuth.ts`: adicionar `companyId`, `companyName` ao User
- [ ] `LoginPage.tsx`: mostrar contas demo das empresas no seletor (opcional)

### 6. Documentação
- [ ] Atualizar `README.md` com o módulo Empresas e novas credenciais demo
- [ ] Atualizar tracking/checkboxes

