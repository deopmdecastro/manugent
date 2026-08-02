# Tracking: Empresas (Multi-company) + Colaboradores + Edifícios + Seeds

## Steps

### Schema SQL (✅ já feito)
- [x] `007_companies_and_relations.sql` — companies, users.company_id, clients.company_id, RPCs
- [x] Espelho Supabase migration

### 1. Seed
- [x] Empresas no seed (companies insert)
- [x] `company_id` nos utilizadores (distribuídos por empresa)
- [x] `company_id` nos clientes (distribuir clientes pelas empresas)
- [ ] Verificar seeds: conhecimento, material, compras, orçamentos, incidentes, calendários, checklists, ficheiros

### 2. Backend API
- [ ] `GET /api/companies` — listar empresas
- [ ] `GET /api/companies/:id` — detalhe empresa
- [ ] `POST /api/companies` — criar empresa
- [ ] `PUT /api/companies/:id` — atualizar
- [ ] `GET /api/companies/:id/collaborators` — colaboradores da empresa
- [ ] Login devolver company_id/company_name
- [ ] `GET /api/users` — filtrar por company_id
- [ ] `GET /api/clients` — filtrar por company_id

### 3. Legacy SPA (public/app/index.html)
- [ ] `APP.companies` no estado local
- [ ] Nav "Empresas" na sidebar (só superadmin)
- [ ] Página Empresas + renderCompanies()
- [ ] `showPage('empresas')` + permissões
- [ ] Colaboradores: filtrar por empresa
- [ ] Clientes/Edifícios: filtro por empresa

### 4. React Auth
- [ ] `useAuth.ts`: companyId, companyName
- [ ] `LoginPage.tsx`: contas demo das empresas

### 5. Documentação
- [ ] Atualizar README.md
- [ ] Atualizar este tracking
