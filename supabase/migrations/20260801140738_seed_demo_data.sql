/*
# Seed Demo Users and Sample Data

Creates demo users for all roles (superadmin, admin, gestor, tecnico, cliente)
with password "Demo@2026" hashed using pgcrypto's crypt() function.
Also creates a demo team, client, and equipment for testing.

1. Data inserted
- 1 team: Equipa Manutenção
- 5 users: superadmin, admin, gestor, tecnico, cliente
- 1 demo client: Cliente Demo
- 1 demo equipment: Bomba Principal
- 1 demo work order: Preventiva mensal

2. Notes
- Password hash uses gen_salt('bf', 10) for bcrypt compatibility
- All emails use @manugent.pt domain (cliente uses @demo.pt)
- Uses ON CONFLICT DO NOTHING for idempotency
*/

-- Create demo team
INSERT INTO teams (name) VALUES ('Equipa Manutenção')
ON CONFLICT DO NOTHING;

-- Create demo users with password "Demo@2026"
-- Using crypt() with gen_salt('bf', 10) for bcrypt hashing
INSERT INTO users (name, email, role, password_hash) VALUES
  ('SuperAdmin', 'superadmin@manugent.pt', 'superadmin', crypt('Demo@2026', gen_salt('bf', 10))),
  ('Admin', 'admin@manugent.pt', 'admin', crypt('Demo@2026', gen_salt('bf', 10))),
  ('Gestor', 'gestor@manugent.pt', 'gestor', crypt('Demo@2026', gen_salt('bf', 10))),
  ('Técnico', 'tecnico@manugent.pt', 'tecnico', crypt('Demo@2026', gen_salt('bf', 10))),
  ('Cliente Demo', 'cliente@demo.pt', 'cliente', crypt('Demo@2026', gen_salt('bf', 10)))
ON CONFLICT (email) DO NOTHING;

-- Create demo client
INSERT INTO clients (name, email, phone) VALUES ('Cliente Demo', 'demo@manugent.pt', '+351 210 000 000')
ON CONFLICT DO NOTHING;

-- Create demo equipment (linked to the demo client)
INSERT INTO equipment (client_id, code, name, brand, model, location, criticality, status)
SELECT c.id, 'EQ-001', 'Bomba Principal', 'Grundfos', 'CR15-3', 'Linha 1', 'critical', 'active'
FROM clients c WHERE c.name = 'Cliente Demo'
AND NOT EXISTS (SELECT 1 FROM equipment WHERE code = 'EQ-001')
ON CONFLICT DO NOTHING;

-- Create demo work order
INSERT INTO work_orders (client_id, equipment_id, team_id, supervisor_id, type, origin, status, priority, title, description, scheduled_for)
SELECT
  c.id, e.id, t.id, u.id,
  'preventive', 'scheduled', 'scheduled', 'high',
  'Preventiva mensal - Bomba Principal',
  'Inspeção programada com medição de vibração no rolamento.',
  now() + interval '1 day'
FROM clients c, equipment e, teams t, users u
WHERE c.name = 'Cliente Demo'
  AND e.code = 'EQ-001'
  AND t.name = 'Equipa Manutenção'
  AND u.email = 'superadmin@manugent.pt'
  AND NOT EXISTS (SELECT 1 FROM work_orders WHERE title = 'Preventiva mensal - Bomba Principal')
ON CONFLICT DO NOTHING;