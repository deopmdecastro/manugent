```txt
npm install
npm run dev
```

## Backend e base de dados com Docker

```txt
docker compose up --build
```

Servicos:

- API: http://localhost:3000
- PostgreSQL: localhost:5432

Endpoints de verificacao:

```txt
GET http://localhost:3000/api/health
GET http://localhost:3000/api/db/health
```

## Ordens de trabalho

Abas:

- Agendadas: `GET /api/work-orders?tab=agendadas`
- Pedidos: `GET /api/work-orders?tab=pedidos`

Tipos agendados:

- `preventive`
- `inspection`
- `round`
- `checklist`

Tipos de pedido:

- `corrective`
- `breakdown`
- `emergency`
- `customer_request`

Estados:

- `open`
- `scheduled`
- `in_progress`
- `paused`
- `waiting_material`
- `waiting_customer`
- `completed`
- `cancelled`

Criar OT:

```txt
POST /api/work-orders
```

Registar resultado/finding:

```txt
POST /api/work-orders/:id/findings
```

Quando uma OT agendada recebe `nok`, `defect`, `measurement_out_of_limits` ou `failure`, a API cria automaticamente um Pedido de Intervencao ligado ao equipamento, cliente e OT original, e grava notificacoes para supervisor e equipa.

Botoes de tempo:

```txt
POST /api/work-orders/:id/time/join
POST /api/work-orders/:id/time/start
POST /api/work-orders/:id/time/pause
POST /api/work-orders/:id/time/resume
POST /api/work-orders/:id/time/exit
```

## Portal do Cliente

Abrir pedidos de assistencia:

```txt
POST /api/client-portal/requests
```

Consultar estado das OTs do cliente:

```txt
GET /api/client-portal/clients/:clientId/work-orders
```

Consultar historico de equipamentos:

```txt
GET /api/client-portal/clients/:clientId/equipment/:equipmentId/history
```

Relatorios de intervencao:

```txt
POST /api/work-orders/:id/reports
GET /api/client-portal/clients/:clientId/reports
GET /api/client-portal/reports/:reportId/pdf
```

Orcamentos:

```txt
POST /api/work-orders/:id/quotes
GET /api/client-portal/clients/:clientId/quotes
POST /api/client-portal/quotes/:quoteId/approve
```

Para correr so a API localmente, com a base de dados do Docker:

```txt
copy .env.example .env
docker compose up db
npm run dev:api
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
