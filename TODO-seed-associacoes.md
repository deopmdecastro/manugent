# TODO: Seed — Documentos/Pastas sempre associados a Empresa/Cliente/Edifício/OT

## Objetivo
Garantir que no `scripts/seed-demo-data.mjs` todos os documentos e pastas gerados
fiquem sempre associados a uma empresa, cliente, edifício ou OT (sem caírem em
pastas de outra empresa ou ficarem sem `empresa_id`).

## Steps

- [x] 1. Criar índice de pastas por (empresa_id, client_id) para resolução fiável
- [x] 2. Reescrever `folderForDoc` para validar que a pasta pertence à mesma empresa
- [x] 3. Fallback: prefere pastas do mesmo cliente → depois da mesma empresa (nunca outra empresa)
- [x] 4. Garantir `empresa_id` e `client_id` não-nulos em todos os documentos
- [x] 5. Verificação de consistência: cada documento na pasta certa da sua empresa/cliente
- [x] 6. Validação de sintaxe `node --check scripts/seed-demo-data.mjs`

## Validação
- [x] `node --check scripts/seed-demo-data.mjs` (exit=0)
- [ ] (opcional) re-correr `npm run db:seed`
