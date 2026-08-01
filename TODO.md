# TODO: ManuGent — Roadmap

## Implementado

- [x] Landing page React + login
- [x] Redirecionamento para dashboard antiga /app/
- [x] Bridge useAuth: sessionStorage + localStorage
- [x] POST /api/auth/login com pgcrypto (bcrypt)
- [x] Schema fixes: clients, equipment, users
- [x] /api/users sem password_hash
- [x] Bootstrap: emails unicos + ON CONFLICT DO NOTHING
- [x] JWT: jsonwebtoken, /api/auth/validate, middleware requireAuth()
- [x] Password Demo@2026 configurada
- [x] SuperAdmin: sidebar 8 seções, /superadmin/*
- [x] LandingManager: GET/PUT /api/admin/landing
- [x] TeamManager: GET/PUT /api/admin/team
- [x] UsersManager: GET /api/users
- [x] BlogManager: GET/PUT /api/admin/blog
- [x] ContentManager: GET/PUT /api/admin/content (docs+FAQ)
- [x] LanguageManager: GET/PUT /api/admin/languages
- [x] SupportManager: GET /api/admin/support (fallback mock)
- [x] Dados persistidos em /data/superadmin/*.json
- [x] API generica: GET/PUT /api/admin/:section
- [x] Botao SuperAdmin na tela de login (role pill com coroa)
- [x] Rota /superadmin/* no server.ts + index.ts
- [x] Rota /funcionalidades no server.ts
- [x] Bota de traducao traduz blog e conteudos
- [x] Pagina dedicada de funcionalidades
- [x] Paginas: documentacao, blog, FAQ, carreiras, contato, privacidade, termos, GDPR, cookies

## Próximos passos

- [x] DELETE /api/admin/:section/:itemId para remover itens (genérico, por id/slug)
- [x] JWT_SECRET obrigatório via env var em producao (o servidor recusa arrancar sem ele quando NODE_ENV=production)
- [x] Password de demo já usa hash bcrypt real (pgcrypto crypt + gen_salt('bf', 10)) — confirmado, não precisou de migração
- [x] Rate limiting no login (8 tentativas / 15 min por IP+email, HTTP 429 + Retry-After)
- [x] Auditoria de seguranca (parcial): rotas /api/admin/* estavam sem autenticação — corrigido, agora exigem JWT + role admin; headers HTTP de segurança adicionados (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS em produção); frontend passou a guardar e enviar o JWT (antes era descartado após o login)

### Seguranca: follow-ups recomendados (nao feitos nesta sessao)

- [ ] Auditoria OWASP completa (input validation em todos os endpoints, SSRF, IDOR em /api/work-orders, /api/clients, etc.)
- [ ] Rate limiting partilhado (Redis) se correr em mais que uma instancia
- [ ] Rever se /api/users deve exigir autenticacao (hoje é publico; é usado por ecrãs nao-admin como atribuição de tecnicos, por isso nao foi alterado sem confirmar impacto)
- [ ] Rotacionar o token de acesso ao GitHub usado nesta sessao (foi partilhado em texto simples)

