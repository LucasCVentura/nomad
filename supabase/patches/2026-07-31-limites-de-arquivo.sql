-- ============================================================================
-- Patch 31/07/2026 — teto de tamanho nos buckets de conteúdo
--
-- O app já barra PDFs acima do limite antes de converter (MAX_FILE_BYTES em
-- src/lib/pdf-convert.ts), mas os buckets não tinham teto próprio: dependiam
-- do limite global do projeto, que pode mudar no dashboard sem ninguém notar.
-- Fixar aqui deixa a falha determinística e igual nos dois lados.
--
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
-- ============================================================================

begin;

-- 50 MB: mesmo teto que o app aplica ao PDF original.
update storage.buckets set file_size_limit = 52428800 where id = 'content-pdfs';

-- 10 MB por página convertida — uma página de texto dá ~400 KB, uma
-- digitalizada algumas vezes isso; 10 MB é folga confortável.
update storage.buckets set file_size_limit = 10485760 where id = 'content-pages';

-- Capas: 10 MB.
update storage.buckets set file_size_limit = 10485760 where id = 'content-images';

commit;
