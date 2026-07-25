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

