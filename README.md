# 🦾 ManuGent v2.0 — Plataforma CMMS com Agente IA

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-6366f1?style=for-the-badge)
![Stack](https://img.shields.io/badge/stack-Hono%20%7C%20React%20%7C%20PostgreSQL-06b6d4?style=for-the-badge)
![IA](https://img.shields.io/badge/IA-OpenAI%20%7C%20Groq-10b981?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-8b5cf6?style=for-the-badge)

**Manutenção Industrial Inteligente · CMMS · Agente IA · Tempo Real**

</div>

---

## 🧠 O que é o ManuGent?

**ManuGent** é uma plataforma **CMMS** (*Computerized Maintenance Management System*) de próxima geração com um **agente de Inteligência Artificial** integrado, especializado em manutenção industrial. Projetado para equipas de manutenção que exigem precisão, velocidade e inteligência — tudo num único painel.

|  |  |  |
|---|---|---|
| 🧠 **Agente IA Real** | OpenAI GPT-4o-mini & Groq Llama 3 | Diagnóstico inteligente |
| 📋 **Ordens de Trabalho** | CRUD completo + tracking de tempo | Fluxo OT ponta a ponta |
| 🔧 **Equipamentos** | Gestão com criticidade e localização | Código QR / NFC ready |
| 👥 **Portal do Cliente** | Pedidos, orçamentos, relatórios | Self-service B2B |
| 📊 **Dashboard KPIs** | Métricas em tempo real | MTBF, MTTR, OEE |
| 📄 **Relatórios PDF** | Geração automática de intervenção | PDF profissional |
| 📱 **Responsivo** | Mobile-first com PWA offline | Tablet + smartphone |
| 🌐 **Offline Mode** | localStorage com sync automática | Sem rede? Sem problema |

---

## 🏗️ Arquitetura

```
manugent/
├── src/
│   ├── server.ts               ← API Hono (Node.js) — backend completo
│   ├── renderer.tsx             ← React SSR entry
│   └── frontend/               ← Base React modular (migração em curso)
│       └── src/
│           ├── components/     ← UI atómica (navigation, ui)
│           ├── layouts/        ← AppShell responsivo
│           ├── pages/          ← Páginas (Dashboard, Login, Projetos…)
│           ├── contexts/       ← Estado global (AppContext)
│           ├── hooks/          ← usePersistentState, etc.
│           ├── services/       ← apiClient com fetch wrapper
│           ├── config/         ← Navegação, constantes
│           ├── styles/         ← CSS com variáveis, glassmorphism
│           └── utils/          ← Formatação, helpers
├── public/
│   ├── app/                    ← SPA legada (HTML/CSS/JS vanilla)
│   │   ├── index.html          ← 12k+ linhas, migração gradual
│   │   └── assets/             ← Imagens, ícones, mascote 3D
│   └── react/                  ← Build React (output do Vite)
├── docker/
│   └── postgres/init/          ← Migrations SQL
├── docker-compose.yml          ← API + PostgreSQL
└── package.json
```

### 🗄️ Popular a Base de Dados Real (SuperAdmin, API, SPA legada)

A camada acima (`src/frontend/src/data/demo/`) alimenta a **landing page React**
sem tocar no backend. Para que o **SuperAdmin**, a API (`/api/*`) e a SPA legada
(`public/app/index.html`) também mostrem dados realistas — em vez de 0 —, é
preciso popular a **base de dados Postgres real**:

```bash
docker compose up -d db      # garante que o Postgres local está a correr
npm run db:seed              # popula ~5.000+ registos reais e interligados
```

O script `scripts/seed-demo-data.mjs`:
- Liga à mesma `DATABASE_URL` usada pela API (por omissão a do `docker-compose.yml`)
- Gera equipas, utilizadores, clientes, equipamentos, ordens de trabalho,
  diagnósticos, notificações, registos de tempo, relatórios, orçamentos e anexos
- É seguro para re-correr (limpa os dados fictícios anteriores antes de inserir)
- **Preserva sempre** as 5 contas de demonstração (`superadmin@manugent.pt`,
  `admin@manugent.pt`, `gestor@manugent.pt`, `tecnico@manugent.pt`,
  `cliente@demo.pt`, password `Demo@2026`)
- Os volumes são ajustáveis via variáveis de ambiente (`SEED_USERS`,
  `SEED_CLIENTS`, `SEED_FINDINGS`, etc.)

### 🧪 Dados Fictícios (Demo Mode)

`src/frontend/src/data/demo/` contém uma base de dados fictícia completa e
relacional (~7.000 registos) que simula um ambiente de produção real, cobrindo
utilizadores, empresas, clientes, edifícios, equipamentos, ordens de trabalho,
pedidos de manutenção, planos preventivos, técnicos, equipas, fornecedores,
inventário/peças, documentos/pastas, contratos, notificações, auditorias,
relatórios, checklists, comentários, testemunhos, anexos, histórico de
atividades e calendário — todos interligados por IDs reais (cliente → edifício
→ equipamento → OT → comentários/anexos).

```ts
import { demoDataService, useDashboardStats, useLandingStats } from './data/demo'

const db = demoDataService.getDatabase()
demoDataService.create('workOrders', novaOT)
demoDataService.update('workOrders', id, { status: 'concluida' })
demoDataService.delete('notifications', id)
```

- **KPIs e estatísticas** (`stats.ts`) são sempre calculados a partir dos dados
  atuais — nunca valores fixos — por isso qualquer criação/edição/remoção
  recalcula automaticamente dashboards e a landing page.
- **Persistência**: os dados vivem em `localStorage`, com pub/sub (`useDemoDatabase`,
  `useDashboardStats`, `useLandingStats`) para que a UI reaja em tempo real.
- **Modo demo** pode ser ligado/desligado sem afetar o backend real via
  `demoDataService.setDemoMode(true | false)`.
- A `StatsBar` e os *floating cards* do `Hero` da landing page já consomem
  estes dados dinamicamente (`src/frontend/src/components/landing/`).

### Stack Tecnológica

| Camada | Tecnologia | Porquê |
|---|---|---|
| 🖥️ **Backend** | [Hono](https://hono.dev) + Node.js | Leve, rápido, TypeScript-native |
| 🗄️ **Base de Dados** | PostgreSQL 14+ | Relacional, transacional, maduro |
| ⚛️ **Frontend Novo** | React 19 + Vite + TypeScript | Componentes, HMR, type-safe |
| 🎨 **UI Legada** | HTML/CSS/JS vanilla + Tailwind CDN | Migração incremental |
| 🧠 **IA** | OpenAI API / Groq API | LLMs reais com fallback local |
| 🐳 **Infra** | Docker Compose | One-command deploy |
| ☁️ **Deploy** | Cloudflare Pages / Node.js | Edge + server |

---

## 🚀 Instalação Rápida

### Pré-requisitos
- **Node.js** 18+
- **PostgreSQL** 14+ (opcional — modo local funciona sem DB)
- **Docker** (recomendado)

### 1. Clone & Instale

```bash
git clone https://github.com/deopmdecastro/manugent.git
cd manugent
npm install
cp .env.example .env
```

### 2. Configure o `.env`

```env
PORT=3000
DATABASE_URL=postgres://manugent:manugent@localhost:5432/manugent

# Provedor de IA (escolha um):
AI_PROVIDER=groq          # 'groq' (grátis, rápido) ou 'openai'
GROQ_API_KEY=gsk_...      # https://console.groq.com/keys
OPENAI_API_KEY=sk-...     # https://platform.openai.com/api-keys
```

### 3. Inicie

```bash
# 🐳 Docker (recomendado — API + DB)
docker compose up --build

# 💻 Apenas API + DB Docker
docker compose up db
npm run dev

# ⚡ Modo local (sem DB)
npm run dev
```

Aceda: **http://localhost:3000**

---

## 🧠 Configurar o Agente IA

O ManuGent usa LLMs reais para diagnósticos e assistência. Sem IA, funciona em **modo local** com respostas pré-definidas.

| Provedor | Custo | Velocidade | Modelo |
|---|---|---|---|
| **Groq** | 🆓 Grátis | ⚡ Rápido | Llama 3 8B |
| **OpenAI** | 💰 Pago | 🚀 Muito rápido | GPT-4o-mini |

### Ativar Groq (grátis)
1. Registe-se em [console.groq.com](https://console.groq.com/)
2. Crie uma API Key
3. `.env` → `GROQ_API_KEY=gsk_...` + `AI_PROVIDER=groq`
4. Reinicie o servidor

### Ativar OpenAI
1. Vá a [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Crie uma API Key
3. `.env` → `OPENAI_API_KEY=sk-...` + `AI_PROVIDER=openai`
4. Reinicie o servidor

Confirme em: `GET /api/ai/status`

---

## 📡 API Endpoints

### Saúde & Status
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Estado do servidor + IA |
| `GET` | `/api/db/health` | Conexão PostgreSQL |
| `GET` | `/api/ai/status` | Provider IA configurado |
| `GET` | `/api/stats` | KPIs do dashboard |

### 🤖 Agente IA
| Método | Rota | Body |
|---|---|---|
| `POST` | `/api/ai/chat` | `{ message, history?, context?, sessionId? }` |

### 📋 Ordens de Trabalho
| Método | Rota | Ação |
|---|---|---|
| `GET` | `/api/work-orders` | Listar (filtros: `tab`, `status`) |
| `GET` | `/api/work-orders/:id` | Detalhe |
| `POST` | `/api/work-orders` | Criar |
| `POST` | `/api/work-orders/:id/status` | Mudar estado |
| `POST` | `/api/work-orders/:id/findings` | Registar resultados |
| `POST` | `/api/work-orders/:id/reports` | Criar relatório |
| `POST` | `/api/work-orders/:id/quotes` | Criar orçamento |

### ⏱️ Time Tracking
| Método | Rota | Ação |
|---|---|---|
| `POST` | `/api/work-orders/:id/time/join` | Técnico junta-se |
| `POST` | `/api/work-orders/:id/time/start` | Iniciar cronómetro |
| `POST` | `/api/work-orders/:id/time/pause` | Pausar |
| `POST` | `/api/work-orders/:id/time/resume` | Retomar |
| `POST` | `/api/work-orders/:id/time/exit` | Sair |
| `GET` | `/api/work-orders/:id/time` | Entradas de tempo |

### 👥 Clientes & Equipamentos
| Método | Rota | Descrição |
|---|---|---|
| `GET` `POST` | `/api/clients` | Listar / Criar |
| `GET` `POST` | `/api/equipment` | Listar / Criar |
| `GET` | `/api/teams` | Lista de equipas |
| `GET` | `/api/users` | Lista de utilizadores |

### 🔔 Notificações
| Método | Rota | Ação |
|---|---|---|
| `GET` | `/api/notifications` | Listar (filtros) |
| `POST` | `/api/notifications/:id/read` | Marcar lida |
| `POST` | `/api/notifications/read-all` | Marcar todas lidas |

### 🏢 Portal do Cliente
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/client-portal/requests` | Novo pedido |
| `GET` | `/api/client-portal/clients/:id/work-orders` | OTs do cliente |
| `GET` | `/api/client-portal/clients/:id/equipment/:eqId/history` | Histórico |
| `GET` | `/api/client-portal/clients/:id/reports` | Relatórios |
| `GET` | `/api/client-portal/clients/:id/quotes` | Orçamentos |
| `POST` | `/api/client-portal/quotes/:id/approve` | Aprovar orçamento |
| `GET` | `/api/client-portal/reports/:id/pdf` | PDF |

---

## 👤 Perfis e Permissões

| Perfil | Acesso | Email de demo |
|---|---|---|
| 🔑 **Admin** | Tudo + configuração IA + utilizadores | `admin@manugent.pt` |
| 📊 **Gestor** | Operacional + relatórios + orçamentos | `gestor@manugent.pt` |
| 🔧 **Técnico** | OTs atribuídas + equipamentos + checklist | `tecnico@manugent.pt` |
| 🏢 **Cliente** | Portal cliente + pedidos + consulta | `cliente@demo.pt` |

O login é validado no backend (`POST /api/auth/login`, hash com `pgcrypto`/bcrypt — ver `docker/postgres/init/003_auth_and_schema_fixes.sql`). As contas de demo acima são criadas com a password **`Demo@2026`**. Roda esta password (ou apaga as contas de demo) antes de expor a aplicação fora de um ambiente de desenvolvimento.

---

## 🖥️ Desenvolvimento

```bash
# API em dev (hot-reload)
npm run dev

# Frontend React (Vite HMR)
npm run dev:frontend

# Build de produção
npm run build          # API + Frontend
npm start              # Servir produção

# Lint TypeScript
npm run lint
```

---

## 🗺️ Roadmap

- [x] Backend API completo (v2.0)
- [x] Agente IA integrado (OpenAI + Groq)
- [x] SPA Frontend completa (legacy)
- [x] Modo offline (localStorage)
- [x] Portal do cliente
- [x] Tracking de tempo
- [x] Geração de PDF
- [x] Base React modular (migração em curso)
- [x] UI com glassmorphism, blur, gradientes
- [x] Responsividade mobile/tablet
- [x] Microinterações e animações
- [ ] Autenticação JWT
- [ ] WebSockets para notificações em tempo real
- [ ] PWA completa com service worker
- [ ] App móvel nativa (React Native)

---

<div align="center">

**Feito com 💜 pela equipa ManuGent**

[Website](https://manugent.pt) · [Documentação](#) · [Suporte](mailto:support@manugent.pt)

</div>
