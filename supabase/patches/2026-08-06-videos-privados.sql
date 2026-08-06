-- ============================================================================
-- Patch 06/08/2026 — vídeo de curso deixa de ser público
--
-- Item 5 da auditoria (AUDITORIA-SEGURANCA.md). O bucket `content-videos`
-- estava marcado como público, com leitura liberada para qualquer um, mas
-- vídeo anexado a um curso é PRODUTO PAGO. Não houve vazamento porque o
-- bucket está vazio — isto é o conserto antes do primeiro upload.
--
-- Passa a seguir o mesmo desenho de `content-pages`: bucket privado, leitura
-- só de quem comprou (ou da Dra.), e o link chega ao navegador assinado e com
-- validade curta, gerado no servidor a cada leitura.
--
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
-- ============================================================================

begin;

update storage.buckets set public = false where id = 'content-videos';

drop policy if exists "Public read of content videos" on storage.objects;

-- A pasta do arquivo é o slug do conteúdo (`<slug>/video-0-123.mp4`).
-- O `or c.id::text = ...` cobre os vídeos que porventura tenham sido salvos
-- sob o id: a tela de edição usava essa convenção enquanto a de criação usava
-- o slug. O código foi padronizado no slug junto com este patch, mas manter as
-- duas formas aqui evita um vídeo tornar-se ilegível por um detalhe de rota.
create policy "Buyers and admin can read content videos"
  on storage.objects for select
  using (
    bucket_id = 'content-videos'
    and (
      public.is_admin()
      or exists (
        select 1
        from public.purchases p
        join public.contents c on c.id = p.content_id
        where p.user_id = auth.uid()
          and (
            c.slug = split_part(storage.objects.name, '/', 1)
            or c.id::text = split_part(storage.objects.name, '/', 1)
          )
      )
    )
  );

commit;
