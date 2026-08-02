# TODO: Seed de Empresas — Clientes Associados + Emails Cooperativos + Credenciais

## Objetivo
Criar no seed (`scripts/seed-demo-data.mjs`) um conjunto completo e relacional de
empresas prestadoras de manutenção, com:
- Cada empresa com o seu domínio de email cooperativo (`domain`);
- Clientes associados às empresas (`clients.empresa_id`);
- Contas cooperativas por empresa (admin, gestor, supervisor, tecnico, financeiro, engenheiro);
- Credenciais (password `Demo@2026`) para todos os admin, gestores e colaboradores.

## Steps

- [x] 1. TRUNCATE: adicionar `empresas` à lista de limpeza (seed idempotente)
- [x] 2. Empresas: inserir coluna `domain` (domínio de email cooperativo) no INSERT
- [x] 3. Contas cooperativas por empresa (6 perfis × 3 empresas) com email no domínio
- [x] 4. Password `Demo@2026` aplicada a TODOS os utilizadores (não só contas fixas)
- [x] 5. Clientes distribuídos pelas 3 empresas e inseridos com `empresa_id`
- [x] 6. Resumo final: credenciais cooperativas por empresa + nº clientes/colaboradores

## Validação
- [x] `npm run lint` (tsc --noEmit) — sem erros
- [x] `npm run build` (API + frontend) — sem erros
- [x] `node --check scripts/seed-demo-data.mjs` — sintaxe corrigida (faltava `console.log` a envolver o resumo de credenciais)
- [ ] `docker compose up -d db`
- [ ] `npm run db:seed`
- [ ] Login `admin@techmaint.pt / Demo@2026`, `gestor@elevenergia.pt / Demo@2026`, etc.

