# ManuGent v2.0 — Plataforma CMMS com Agente IA

**ManuGent** é uma plataforma CMMS (Computerized Maintenance Management System) com agente de Inteligência Artificial integrado, especializada em manutenção industrial.

---

## Funcionalidades Implementadas

### ✅ Agente IA Real (v2.0)
- Integração com **OpenAI** (GPT-4o-mini) e **Groq** (Llama 3) — configurável via `.env`
- Contexto dinâmico: OTs abertas, equipamentos, clientes, estatísticas
- Histórico de conversa por sessão (até 20 mensagens)
- Fallback para modo local quando IA não configurada
- Renderização de Markdown nas respostas
- Persistência de conversas na base de dados (tabela `ai_conversations`)
- Indicadores de status em tempo real (provedor, modelo, online/offline)

### ✅ Backend API (Hono + Node.js)
- **Ordens de Trabalho**: CRUD completo, mudança de estado, findings, links automáticos
- **Portal do Cliente**: pedidos, histórico de equipamentos, relatórios, orçamentos
- **Tracking de Tempo**: join/start/pause/resume/exit com cronómetro por técnico
- **Notificações**: criação automática por eventos (NOK, orçamento aprovado, etc.)
- **Clientes & Equipamentos**: CRUD com filtros
- **Equipas & Utilizadores**: gestão de membros
- **Dashboard Stats**: endpoint `/api/stats` com KPIs em tempo real
- **PDF**: geração de relatórios de intervenção em PDF
- **CORS**: configurado para acesso cross-origin

### ✅ Frontend (SPA)
- Dashboard com KPIs e OTs recentes
- Ordens de Trabalho (agendadas + pedidos) com filtros e detalhe
- Gestão de Equipamentos, Clientes, Edifícios, Técnicos
- Base de Conhecimento, Ficheiros, Calendário
- Checklists, Incidentes, Materiais, Compras, Orçamentos
- Assistente IA com histórico, sugestões rápidas, upload de ficheiros/fotos/QR
- Reconhecimento de voz (Web Speech API)
- Leitura NFC de tags de equipamentos
- Página de Settings com configuração de IA e permissões por perfil
- Sync automática com backend (OTs, notificações, stats)
- Modo offline total (localStorage)

---

## Endpoints de API

### Saúde
```
GET  /api/health          → Estado do servidor e IA
GET  /api/db/health       → Estado da base de dados
GET  /api/ai/status       → Provedor IA configurado
GET  /api/stats           → KPIs do dashboard
```

### Agente IA
```
POST /api/ai/chat         → Chat com ManuGent IA (real LLM)
```
Body: `{ message, history?, context?, sessionId? }`

### Ordens de Trabalho
```
GET    /api/work-orders              → Lista (filtros: tab, status)
GET    /api/work-orders/:id          → Detalhe
POST   /api/work-orders              → Criar
POST   /api/work-orders/:id/status   → Mudar estado
POST   /api/work-orders/:id/findings → Registar resultados (cria OT corretiva auto)
POST   /api/work-orders/:id/reports  → Criar relatório
POST   /api/work-orders/:id/quotes   → Criar orçamento
POST   /api/work-orders/:id/time/join    → Técnico junta-se
POST   /api/work-orders/:id/time/start   → Iniciar cronómetro
POST   /api/work-orders/:id/time/pause   → Pausar
POST   /api/work-orders/:id/time/resume  → Retomar
POST   /api/work-orders/:id/time/exit    → Sair
GET    /api/work-orders/:id/time         → Entradas de tempo
```

### Clientes & Equipamentos
```
GET  /api/clients          → Lista de clientes
POST /api/clients          → Criar cliente
GET  /api/equipment        → Lista (filtro: clientId)
POST /api/equipment        → Criar equipamento
GET  /api/teams            → Lista de equipas
GET  /api/users            → Lista de utilizadores
```

### Notificações
```
GET  /api/notifications                   → Lista (filtros: workOrderId, unread)
POST /api/notifications/:id/read         → Marcar lida
POST /api/notifications/read-all         → Marcar todas lidas
```

### Portal do Cliente
```
POST /api/client-portal/requests                                          → Novo pedido
GET  /api/client-portal/clients/:id/work-orders                          → OTs do cliente
GET  /api/client-portal/clients/:id/equipment/:eqId/history              → Histórico
GET  /api/client-portal/clients/:id/reports                              → Relatórios
GET  /api/client-portal/clients/:id/quotes                               → Orçamentos
POST /api/client-portal/quotes/:id/approve                               → Aprovar orçamento
GET  /api/client-portal/reports/:id/pdf                                  → PDF
```

---

## Instalação e Execução

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+ (opcional — sem DB, funciona em modo local)

### Setup
```bash
git clone https://github.com/deopmdecastro/manugent.git
cd manugent
npm install
cp .env.example .env
# Edite .env com as suas chaves
```

### Configuração `.env`
```env
PORT=3000
DATABASE_URL=postgres://manugent:manugent@localhost:5432/manugent

# Escolha o provedor IA:
AI_PROVIDER=groq          # 'groq' (gratuito) ou 'openai'
GROQ_API_KEY=gsk_...      # https://console.groq.com/keys
OPENAI_API_KEY=sk-...     # https://platform.openai.com/api-keys
```

### Com Docker (recomendado)
```bash
docker compose up --build
# API: http://localhost:3000
# PostgreSQL: localhost:5432
```

### Desenvolvimento local
```bash
# Só API + PostgreSQL Docker
docker compose up db
npm run dev

# Sem base de dados
npm run dev
```

### Build de produção
```bash
npm run build
npm start
```

---

## Configurar Agente IA

O agente ManuGent usa LLMs reais via API. Para ativar:

1. **Groq (gratuito, rápido)**:
   - Registe em https://console.groq.com
   - Crie uma API Key
   - Adicione ao `.env`: `GROQ_API_KEY=gsk_...`
   - Defina `AI_PROVIDER=groq`

2. **OpenAI**:
   - Vá a https://platform.openai.com/api-keys
   - Crie uma API Key
   - Adicione ao `.env`: `OPENAI_API_KEY=sk-...`
   - Defina `AI_PROVIDER=openai`

3. **Reinicie o servidor** e aceda a `/api/ai/status` para confirmar.

Sem configuração, o assistente usa **modo local** (respostas pré-definidas) — funcional mas sem IA real.

---

## Arquitetura

```
manugent/
├── src/
│   └── server.ts          # API Hono (Node.js) — backend completo
├── public/
│   └── app/
│       ├── index.html     # SPA Frontend completa
│       └── assets/        # Imagens, ícones, mascote 3D
├── docker/
│   └── postgres/init/     # Scripts SQL de migração
├── .env.example           # Template de configuração
├── docker-compose.yml     # Docker com API + PostgreSQL
└── package.json           # Dependências e scripts
```

**Stack:**
- Backend: **Hono** + **Node.js** + **PostgreSQL** (pg)
- Frontend: HTML/CSS/JS vanilla + Tailwind CDN
- IA: **OpenAI API** / **Groq API** (compatível OpenAI)
- Infra: Docker Compose / Cloudflare Pages

---

## Perfis e Permissões

| Perfil | Acesso |
|--------|--------|
| Admin | Tudo + configuração IA + utilizadores |
| Gestor | Operacional + relatórios + orçamentos |
| Técnico | OTs atribuídas + equipamentos + checklist |
| Cliente | Portal cliente + pedidos + consulta |

---

## Estado do Projeto

- ✅ Backend API completo (v2.0)
- ✅ Agente IA integrado (OpenAI + Groq)
- ✅ SPA Frontend completa
- ✅ Modo offline (localStorage)
- ✅ Portal do cliente
- ✅ Tracking de tempo
- ✅ Geração de PDF
- ⏳ Autenticação JWT (próxima versão)
- ⏳ WebSockets para notificações em tempo real
- ⏳ App móvel (PWA)
