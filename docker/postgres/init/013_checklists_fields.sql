-- Campos adicionais em checklists para suportar o formulário da SPA legada
-- (título, descrição, frequência, categoria, equipamento associado).
ALTER TABLE checklists
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS frequency text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS equipment_id uuid REFERENCES equipment(id) ON DELETE SET NULL;
