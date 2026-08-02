-- Adiciona campo "zonas" ao edifício, usado no formulário da SPA legada
-- (public/app/index.html) ao migrar de localStorage para a API real.
ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS zones text;
