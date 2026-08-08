/*
# Motor de Busca Global — endereços, localidades, distritos/concelhos,
  zonas, edifícios, IDs de OT, palavras-chave e nomes de técnicos

1. Extensão
   - `pg_trgm` para similaridade/tolerância a erros ortográficos
     (similarity(), índices GIN trigram).

2. Novas colunas em `buildings`
   - `distrito`, `concelho` (text, nullable, aditivo) — complementam
     `address`/`city`/`zones` já existentes, permitindo pesquisa
     geográfica mais fina (ex.: "edifícios no distrito do Porto").

3. Função utilitária `pt_normalize(text)`
   - Remove acentos/diacríticos e baixa para minúsculas sem depender da
     extensão `unaccent` (que em Supabase vive no schema `extensions` e
     nem sempre está acessível por SECURITY DEFINER) — usa `translate()`
     puro, portanto funciona igual em Supabase e no Postgres local do
     Docker.

4. Índices GIN trigram sobre as colunas normalizadas mais pesquisadas,
   para tornar a busca com erros de escrita e substring rápida mesmo com
   muitos registos.

5. RPC `search_global(p_query text, p_limit int)`
   - Pesquisa unificada (UNION ALL) sobre: edifícios (nome, endereço,
     cidade, distrito, concelho, zonas), clientes, equipamentos (nome,
     código, marca, modelo, localização, nº de série), OTs (id, título,
     descrição, tipo, prioridade, estado), técnicos/utilizadores (nome,
     email, role, equipa), achados de OT / palavras-chave
     (work_order_findings.description) e relatórios de intervenção.
   - Cada linha devolve: result_type, id, title, subtitle, context, score.
   - Score combina: correspondência exacta > prefixo/substring > trigram
     similarity, para servir de base a um ranking único e "robusto".

Aditivo — tudo usa `ADD COLUMN IF NOT EXISTS` / `CREATE ... IF NOT EXISTS`,
não quebra dados nem funções existentes.
*/

-- ── 1. Extensão de similaridade ────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── 2. Geografia adicional em buildings ─────────────────────────────────────

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS distrito text,
  ADD COLUMN IF NOT EXISTS concelho text;

-- ── 3. Normalização sem acentos (sem depender da extensão unaccent) ───────

CREATE OR REPLACE FUNCTION pt_normalize(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT trim(regexp_replace(
    lower(
      translate(
        coalesce(p_text, ''),
        'áàâãäåāąÁÀÂÃÄÅĀĄéèêëēęÉÈÊËĒĘíìîïīÍÌÎÏĪóòôõöøōÓÒÔÕÖØŌúùûüūÚÙÛÜŪçÇñÑ',
        'aaaaaaaaAAAAAAAAeeeeeeEEEEEEiiiiiIIIIIoooooooOOOOOOOuuuuuUUUUUcCnN'
      )
    ),
    '[^a-z0-9]+', ' ', 'g'
  ))
$$;

COMMENT ON FUNCTION pt_normalize(text) IS
  'Remove acentos/diacríticos PT e normaliza para minúsculas + espaços únicos, sem depender da extensão unaccent. Usado pelo motor de busca global.';

-- ── 4. Índices trigram para pesquisa tolerante a erros ─────────────────────

CREATE INDEX IF NOT EXISTS idx_buildings_search_trgm
  ON buildings USING gin (
    pt_normalize(coalesce(name,'') || ' ' || coalesce(address,'') || ' ' || coalesce(city,'') || ' ' || coalesce(distrito,'') || ' ' || coalesce(concelho,'') || ' ' || coalesce(zones,''))
    gin_trgm_ops
  );

CREATE INDEX IF NOT EXISTS idx_clients_search_trgm
  ON clients USING gin (
    pt_normalize(coalesce(name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(phone,''))
    gin_trgm_ops
  );

CREATE INDEX IF NOT EXISTS idx_equipment_search_trgm
  ON equipment USING gin (
    pt_normalize(coalesce(name,'') || ' ' || coalesce(code,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(model,'') || ' ' || coalesce(location,'') || ' ' || coalesce(serial,''))
    gin_trgm_ops
  );

CREATE INDEX IF NOT EXISTS idx_work_orders_search_trgm
  ON work_orders USING gin (
    pt_normalize(coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(type,'') || ' ' || coalesce(status,''))
    gin_trgm_ops
  );

CREATE INDEX IF NOT EXISTS idx_users_search_trgm
  ON users USING gin (
    pt_normalize(coalesce(name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(role,''))
    gin_trgm_ops
  );

CREATE INDEX IF NOT EXISTS idx_work_order_findings_search_trgm
  ON work_order_findings USING gin (pt_normalize(coalesce(description,'')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_intervention_reports_search_trgm
  ON intervention_reports USING gin (
    pt_normalize(coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(actions_performed,'') || ' ' || coalesce(recommendations,''))
    gin_trgm_ops
  );

-- ── 5. RPC unificada de busca global ────────────────────────────────────────

DROP FUNCTION IF EXISTS search_global(text, integer);
CREATE OR REPLACE FUNCTION search_global(p_query text, p_limit integer DEFAULT 30)
RETURNS TABLE (
  result_type text,
  id text,
  title text,
  subtitle text,
  context text,
  score real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_q text := pt_normalize(p_query);
BEGIN
  IF v_q IS NULL OR length(v_q) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH ranked AS (
    -- Edifícios: nome, endereço, cidade, distrito, concelho, zonas
    SELECT
      'building'::text AS result_type,
      b.id::text AS id,
      b.name AS title,
      coalesce(b.address, '') || CASE WHEN b.city IS NOT NULL THEN ' — ' || b.city ELSE '' END AS subtitle,
      coalesce(b.distrito, '') || CASE WHEN b.concelho IS NOT NULL THEN ' / ' || b.concelho ELSE '' END
        || CASE WHEN b.zones IS NOT NULL THEN ' — zonas: ' || b.zones ELSE '' END AS context,
      GREATEST(
        similarity(pt_normalize(b.name), v_q),
        similarity(pt_normalize(coalesce(b.address,'')), v_q),
        similarity(pt_normalize(coalesce(b.city,'')), v_q),
        similarity(pt_normalize(coalesce(b.distrito,'')), v_q),
        similarity(pt_normalize(coalesce(b.concelho,'')), v_q),
        similarity(pt_normalize(coalesce(b.zones,'')), v_q),
        CASE WHEN pt_normalize(b.name) = v_q THEN 1.0
             WHEN pt_normalize(coalesce(b.address,'') || ' ' || coalesce(b.city,'') || ' ' || coalesce(b.distrito,'') || ' ' || coalesce(b.concelho,'') || ' ' || coalesce(b.zones,'')) LIKE '%' || v_q || '%' THEN 0.9
             ELSE 0 END
      )::real AS score
    FROM buildings b

    UNION ALL

    -- Clientes
    SELECT
      'client', c.id::text, c.name,
      coalesce(c.email, '') || CASE WHEN c.phone IS NOT NULL THEN ' — ' || c.phone ELSE '' END,
      '',
      GREATEST(
        similarity(pt_normalize(c.name), v_q),
        similarity(pt_normalize(coalesce(c.email,'')), v_q),
        CASE WHEN pt_normalize(c.name) LIKE '%' || v_q || '%' THEN 0.9 ELSE 0 END
      )::real
    FROM clients c

    UNION ALL

    -- Equipamentos: nome, código, marca, modelo, localização, nº série
    SELECT
      'equipment', e.id::text, e.name,
      coalesce(e.code, '') || CASE WHEN e.brand IS NOT NULL THEN ' — ' || e.brand ELSE '' END || CASE WHEN e.model IS NOT NULL THEN ' ' || e.model ELSE '' END,
      coalesce(e.location, ''),
      GREATEST(
        similarity(pt_normalize(e.name), v_q),
        similarity(pt_normalize(coalesce(e.code,'')), v_q),
        similarity(pt_normalize(coalesce(e.brand,'')), v_q),
        similarity(pt_normalize(coalesce(e.model,'')), v_q),
        similarity(pt_normalize(coalesce(e.location,'')), v_q),
        similarity(pt_normalize(coalesce(e.serial,'')), v_q),
        CASE WHEN pt_normalize(coalesce(e.code,'')) = v_q THEN 1.0
             WHEN pt_normalize(coalesce(e.name,'') || ' ' || coalesce(e.code,'') || ' ' || coalesce(e.location,'')) LIKE '%' || v_q || '%' THEN 0.9
             ELSE 0 END
      )::real
    FROM equipment e

    UNION ALL

    -- Ordens de Trabalho: ID (uuid), título, descrição, tipo, prioridade, estado
    SELECT
      'work_order', wo.id::text, wo.title,
      wo.status || ' | ' || wo.priority || ' | ' || wo.type,
      coalesce(wo.description, ''),
      GREATEST(
        similarity(pt_normalize(wo.title), v_q),
        similarity(pt_normalize(coalesce(wo.description,'')), v_q),
        CASE WHEN wo.id::text ILIKE '%' || p_query || '%' THEN 0.97 ELSE 0 END,
        CASE WHEN pt_normalize(wo.title) LIKE '%' || v_q || '%' THEN 0.9 ELSE 0 END
      )::real
    FROM work_orders wo

    UNION ALL

    -- Técnicos / utilizadores (staff)
    SELECT
      'technician', u.id::text, u.name,
      u.role || COALESCE(' — ' || t.name, ''),
      coalesce(u.email, ''),
      GREATEST(
        similarity(pt_normalize(u.name), v_q),
        similarity(pt_normalize(coalesce(u.email,'')), v_q),
        CASE WHEN pt_normalize(u.name) LIKE '%' || v_q || '%' THEN 0.9 ELSE 0 END
      )::real
    FROM users u
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE u.role IN ('technician', 'admin', 'superadmin', 'supervisor')

    UNION ALL

    -- Palavras-chave em achados de OT (defeitos, notas, medições)
    SELECT
      'finding', f.id::text,
      left(f.description, 80),
      f.type || ' — OT ' || f.work_order_id::text,
      '',
      GREATEST(
        similarity(pt_normalize(f.description), v_q),
        CASE WHEN pt_normalize(f.description) LIKE '%' || v_q || '%' THEN 0.9 ELSE 0 END
      )::real
    FROM work_order_findings f

    UNION ALL

    -- Relatórios de intervenção
    SELECT
      'intervention_report', ir.id::text, ir.title,
      left(ir.summary, 120),
      coalesce(ir.actions_performed, ''),
      GREATEST(
        similarity(pt_normalize(ir.title), v_q),
        similarity(pt_normalize(ir.summary), v_q),
        similarity(pt_normalize(coalesce(ir.actions_performed,'')), v_q),
        similarity(pt_normalize(coalesce(ir.recommendations,'')), v_q),
        CASE WHEN pt_normalize(ir.title) LIKE '%' || v_q || '%' THEN 0.9 ELSE 0 END
      )::real
    FROM intervention_reports ir
  )
  SELECT r.result_type, r.id, r.title, r.subtitle, r.context, r.score
  FROM ranked r
  WHERE r.score > 0.28
  ORDER BY r.score DESC
  LIMIT p_limit;
END;
$$;

-- Grants (condicional — standalone Docker não tem roles anon/authenticated)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION search_global(text, integer) TO anon, authenticated';
  END IF;
END $$;
