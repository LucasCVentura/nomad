-- ============================================================================
-- Patch 06/08/2026 — categoria deixa de ser obrigatória
--
-- O campo "Categoria" no cadastro de conteúdo saiu da interface (a Dra. não
-- vai preenchê-lo — decisão de produto, não uma lista de opções ruim: já
-- tinha virado texto livre antes e mesmo assim não fazia sentido pedir).
-- Junto saíram os filtros da loja e o badge nos cards, que eram gerados a
-- partir desse valor.
--
-- NOT NULL sai (não a coluna): os 2 conteúdos existentes mantêm o valor que
-- já tinham, e reverter é só reintroduzir a exigência, sem precisar
-- recriar dado nenhum. Nada mais na leitura considera esse campo — só não
-- é mais coletado nem mostrado.
--
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
-- ============================================================================

begin;

alter table public.contents alter column category drop not null;

commit;
