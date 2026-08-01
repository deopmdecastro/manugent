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

- [ ] DELETE /api/admin/:section para remover itens
- [ ] JWT_SECRET via env var em producao
- [ ] Migrar password de demo para hash bcrypt real
- [ ] Rate limiting no login
- [ ] Auditoria de seguranca (OWASP top 10)
