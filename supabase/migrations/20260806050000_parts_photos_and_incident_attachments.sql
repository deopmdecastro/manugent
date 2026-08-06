/*
# Material: múltiplos anexos (fotos/vídeos/documentos/áudios)

1. Novo: `parts.photos` (jsonb, array), espelhando o padrão já usado em
   `incidents.photos`. Até agora o material só guardava uma única foto,
   e só no lado do cliente (`APP.stockMaterials`) — nunca era persistida
   no backend, porque a coluna nem sequer existia.

2. Este ficheiro não altera `incidents.photos` (já existe e já é jsonb),
   apenas documenta que o mesmo campo passa a guardar múltiplos anexos de
   qualquer tipo (imagem, vídeo, documento, áudio), não só imagens.
*/

ALTER TABLE parts
  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]';
