-- ============================================================================
-- Patch 05/08/2026 — status "Em breve" para conteúdos
--
-- Um terceiro estado entre rascunho e publicado: aparece na vitrine (capa,
-- categoria, título, descrição) mas sem preço nem botão de compra — o
-- checkout já só aceita 'published' (api/checkout/route.ts filtra por isso),
-- então coming_soon nunca fica comprável por acidente, nem por chamada
-- direta à API.
--
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
-- ============================================================================

begin;

alter table public.contents drop constraint if exists contents_status_check;
alter table public.contents add constraint contents_status_check
  check (status in ('draft', 'published', 'coming_soon'));

-- store_contents ganha a coluna status, para o front distinguir "em breve" de
-- "publicado" e trocar o preço/CTA por um selo — e passa a incluir as duas.
-- status vai por último: CREATE OR REPLACE VIEW só aceita ACRESCENTAR colunas
-- no fim, não reordenar as existentes.
create or replace view public.store_contents
with (security_invoker = false) as
select
  id,
  slug,
  title,
  category,
  format,
  pages,
  price,
  description,
  cover_image_url,
  created_at,
  status
from public.contents
where status in ('published', 'coming_soon');

commit;
