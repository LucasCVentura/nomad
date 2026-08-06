-- ============================================================================
-- Patch 06/08/2026 — correções da auditoria de segurança
--
-- Dois furos confirmados com prova de conceito contra o banco de produção.
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. CRÍTICO — escrita em `contents` por qualquer visitante, via a view.
--
-- `store_contents` existe para mostrar a vitrine sem expor `body`, e para isso
-- roda com o privilégio do dono (security_invoker = false), passando por cima
-- da RLS de `contents` — que é justamente o ponto.
--
-- O problema: a view é SIMPLES, então o Postgres a torna AUTO-ATUALIZÁVEL, e o
-- grant de escrita que veio junto do `grant select` fez o resto. Um INSERT na
-- view vira INSERT em `contents` executado como o dono, ignorando as policies
-- "Only admin can insert/update/delete contents".
--
-- Verificado antes da correção, sem login nenhum: INSERT devolveu 201, UPDATE
-- de preço/título devolveu 200 e DELETE devolveu 204.
--
-- A view precisa ser somente-leitura. SELECT continua liberado; o resto sai.
revoke insert, update, delete, truncate, references
  on public.store_contents from anon, authenticated;

-- Mesma limpeza nas outras duas. Hoje não são auto-atualizáveis (têm join e
-- agregação, o Postgres recusaria a escrita), mas depender disso é frágil:
-- basta alguém simplificar a view um dia para o furo reabrir sozinho.
revoke insert, update, delete, truncate, references
  on public.public_reviews from anon, authenticated;
revoke insert, update, delete, truncate, references
  on public.platform_stats from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. ALTO — qualquer aluna logada lia o cadastro de todas as outras.
--
-- A policy abaixo liberava a linha inteira de `profiles` para qualquer sessão
-- autenticada. Como RLS é por LINHA, isso entregava junto `email`, `cpf` e
-- `asaas_customer_id` de todo mundo — dado pessoal sensível (LGPD), e o CPF
-- ainda é o que o Asaas usa para identificar a cliente.
--
-- Verificado antes da correção: uma conta recém-criada, sem nenhuma compra,
-- leu os 3 perfis da base com CPF e e-mail à mostra.
--
-- Não há uso legítimo: toda leitura do app é ou do próprio perfil, ou da Dra.
-- lendo o de outra pessoa — e as duas já são cobertas pela policy que fica
-- ("Profiles are viewable by owner or admin"). O único lugar que lê nome de
-- terceiro é a caixa de entrada do admin, via is_admin().
drop policy if exists "Signed-in users can view basic profile info" on public.profiles;

-- ---------------------------------------------------------------------------
-- 3. BAIXO — anotação em conteúdo que a aluna não comprou.
--
-- A policy exigia só que a linha fosse dela, sem checar se ela tem acesso ao
-- conteúdo anotado. Não vaza nada (ela não lê o material por isso), mas deixa
-- gravar texto arbitrário na base apontando para qualquer conteúdo.
--
-- USING continua só na posse, para que ela sempre consiga ler e apagar as
-- próprias anotações mesmo que perca o acesso ao conteúdo depois; a checagem
-- nova entra só no WITH CHECK, que é o que governa INSERT e UPDATE.
drop policy if exists "Users manage their own annotations" on public.annotations;

create policy "Users manage their own annotations"
  on public.annotations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and public.has_content_access(content_id));

commit;
