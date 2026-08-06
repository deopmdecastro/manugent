/*
# Resolução de Incidentes

Adiciona campos para registar a resolução de um incidente quando este é
marcado como "resolvido" a partir da UI (modal de resolução).

1. Novas colunas
   - `incidents.resolution_notes` (text) — descrição da resolução aplicada
   - `incidents.resolved_by` (uuid, FK users) — colaborador que resolveu

Aditivo (ADD COLUMN IF NOT EXISTS) — não quebra dados existentes.
*/

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS resolution_notes text,
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES users(id);

CREATE INDEX IF NOT EXISTS incidents_client_idx ON incidents(client_id);

-- Permite criar incidentes a partir da UI sem forçar uma das categorias
-- técnicas pré-definidas (a UI atual não tem um seletor de tipo).
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_type_check;
ALTER TABLE incidents ADD CONSTRAINT incidents_type_check CHECK (type IN (
  'falha_eletrica', 'inundacao', 'incendio', 'elevador_avariado', 'avac_indisponivel',
  'fuga_agua', 'intrusao', 'alarme_ativo', 'falha_comunicacao', 'equipamento_critico_parado', 'outro'
));
ALTER TABLE incidents ALTER COLUMN type SET DEFAULT 'outro';
