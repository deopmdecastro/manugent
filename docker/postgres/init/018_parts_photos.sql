-- Espelha supabase/migrations/20260806050000_parts_photos_and_incident_attachments.sql

ALTER TABLE parts
  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]';
