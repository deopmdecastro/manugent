# TODO: Substituir Dashboard React pelo Dashboard Antigo (HTML)

## Objetivo
Manter landing page React + login, mas após login redirecionar para a dashboard antiga em `/app/`

## Passos

- [x] **PASSO 1 - Análise**: Ler ficheiros relevantes (routes.ts, useAuth.ts, AuthGuard.tsx, App.tsx, LoginPage.tsx, server.ts, vite.frontend.config.ts)
- [x] **PASSO 2 - Plano**: Apresentar plano ao utilizador e obter aprovação

### Implementação

- [x] **PASSO 3 - routes.ts**: Remover rotas de dashboard protegidas (manter apenas landing e login)
- [x] **PASSO 4 - LoginPage.tsx**: Alterar navegação após login de `/dashboard/admin` para `/app/`
- [x] **PASSO 5 - App.tsx**: Simplificar para remover lógica desnecessária de shell/AuthGuard
- [x] **PASSO 6 - useAuth.ts**: Adicionar bridge para legacy dashboard (sessionStorage + localStorage)
- [x] **PASSO 7 - Teste**: Build concluído com sucesso ✓

## Segurança: Autenticação real (2026-07-25)

- [x] Corrigido: login aceitava qualquer password (mock 100% client-side em `useAuth.ts`, sem validação no backend, sem endpoint `/api/auth/login`).
- [x] Adicionado `POST /api/auth/login` com verificação real via `pgcrypto` (bcrypt) — ver `docker/postgres/init/003_auth_and_schema_fixes.sql`.
- [x] Corrigido desfasamento de schema: `clients.email/phone`, `equipment.brand/model/serial/criticality/status` e `users.email/password_hash` existiam no código (`server.ts`) mas não nos scripts `001`/`002`, o que fazia `/api/work-orders/demo/bootstrap` e `/api/equipment` (POST) falhar contra uma BD criada de raiz.
- [x] `/api/users` deixou de devolver `password_hash` (antes fazia `select u.*`).
- [ ] **Seguinte**: `/api/work-orders/demo/bootstrap` colide com os emails de demo (`tecnico@manugent.pt`) agora que `users.email` é único — usar `on conflict do nothing` ou emails únicos por chamada.
- [ ] **Seguinte**: não há sessões/tokens assinados no backend — o token `mg-session-*` gerado em `useAuth.ts` (bridge para o dashboard legado) não é validado no servidor. Para produção, substituir por sessão/JWT verificado em cada pedido protegido.
- [ ] Rodar a password de demo (`Demo@2026`, ver README) antes de expor isto fora de ambiente de desenvolvimento.

