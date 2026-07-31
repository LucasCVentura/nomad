-- ============================================================================
-- Patch 31/07/2026 — fecha o acesso público ao conteúdo pago
--
-- Antes disso, a policy "Published contents are public" liberava a LINHA
-- inteira de `contents` para qualquer um. Como RLS no Postgres é por linha e
-- não por coluna, o `body` — as páginas e o texto do curso — ia junto: dava
-- para baixar o curso completo só com a chave anônima, sem conta e sem compra.
--
-- Rode uma vez no SQL Editor do Supabase. Já está incorporado ao schema.sql,
-- então quem criar o projeto do zero não precisa deste arquivo.
--
-- Precisa ser aplicado ANTES (ou junto com) o deploy que passa a ler
-- `store_contents` nas telas de loja.
-- ============================================================================

begin;

-- 1. Vitrine: só os campos que vendem o curso. Sem `body`.
--    security_invoker = false faz a view rodar com os privilégios do dono,
--    enxergando além da RLS da tabela, mas expondo apenas estas colunas.
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
  created_at
from public.contents
where status = 'published';

grant select on public.store_contents to anon, authenticated;

-- 2. A tabela passa a entregar o conteúdo só para quem comprou (ou a admin).
drop policy if exists "Published contents are public" on public.contents;
drop policy if exists "Buyers and admin can read a content" on public.contents;

create policy "Buyers and admin can read a content"
  on public.contents for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.purchases p
      where p.content_id = contents.id
        and p.user_id = auth.uid()
    )
  );

-- 3. A aluna só altera as colunas que são dela. A policy de update sozinha
--    escopa a linha, mas deixava reescrever qualquer coluna — inclusive
--    content_id, trocando o curso barato comprado pelo caro.
revoke update on public.purchases from anon, authenticated;
grant update (progress, completed_at, updated_seen_at, rating, review)
  on public.purchases to authenticated;

commit;

-- ----------------------------------------------------------------------------
-- Conferência rápida (deve devolver 0 linhas para quem não comprou):
--
--   set role anon;
--   select id from public.contents;      -- 0 linhas
--   select count(*) from public.store_contents;  -- os publicados, sem body
--   reset role;
-- ----------------------------------------------------------------------------
