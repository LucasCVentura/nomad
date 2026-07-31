-- ============================================================================
-- Patch 31/07/2026 — páginas do PDF em bucket privado
--
-- As páginas convertidas estavam indo para `content-images`, que é público.
-- Como o slug do curso é público (aparece em store_contents), qualquer um
-- poderia montar a URL `/storage/v1/object/public/content-images/<slug>/page-0.jpg`
-- e baixar o curso página por página — o mesmo vazamento do patch anterior,
-- por outra porta.
--
-- Este bucket é privado: o app gera URLs assinadas na hora de renderizar, e
-- a policy abaixo garante que só quem comprou (ou a admin) consegue assinar.
--
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
-- ============================================================================

begin;

insert into storage.buckets (id, name, public)
values ('content-pages', 'content-pages', false)
on conflict (id) do update set public = false;

drop policy if exists "Buyers and admin can read content pages" on storage.objects;
drop policy if exists "Only admin can upload content pages" on storage.objects;
drop policy if exists "Only admin can update content pages" on storage.objects;
drop policy if exists "Only admin can delete content pages" on storage.objects;

-- O primeiro segmento do caminho é o slug do curso: `<slug>/page-0.jpg`.
create policy "Buyers and admin can read content pages"
  on storage.objects for select
  using (
    bucket_id = 'content-pages'
    and (
      public.is_admin()
      or exists (
        select 1
        from public.purchases p
        join public.contents c on c.id = p.content_id
        where p.user_id = auth.uid()
          and c.slug = split_part(storage.objects.name, '/', 1)
      )
    )
  );

create policy "Only admin can upload content pages"
  on storage.objects for insert
  with check (bucket_id = 'content-pages' and public.is_admin());

create policy "Only admin can update content pages"
  on storage.objects for update
  using (bucket_id = 'content-pages' and public.is_admin());

create policy "Only admin can delete content pages"
  on storage.objects for delete
  using (bucket_id = 'content-pages' and public.is_admin());

commit;
