-- ============================================================================
-- Patch 06/08/2026 — agregações movidas do app para o banco (performance)
--
-- Auditoria de performance. Três telas do admin puxavam TODAS as linhas de uma
-- tabela para o servidor Next e agregavam em JavaScript (contar não-lidas,
-- achar a última mensagem, somar receita). Com dados de teste (5.000 mensagens)
-- isso transferia ~355 kB por carregamento — e o total de não-lidas re-executa
-- a cada mensagem nova via Realtime. Escala com o histórico inteiro da
-- plataforma, não com o que está na tela.
--
-- Estas funções fazem a conta no Postgres e devolvem só o resultado. São
-- security definer + checagem de is_admin() dentro: quem não é admin recebe
-- vazio/zero, então continuam seguras mesmo sendo chamadas via RPC público.
--
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
-- ============================================================================

begin;

-- Total de mensagens de alunas ainda não lidas pela Dra., somado entre todas
-- as conversas. Era: baixar todas as mensagens e contar em JS. Agora: um count.
create or replace function public.admin_unread_total()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.conversation_messages m
  join public.conversations c on c.id = m.conversation_id
  where public.is_admin()
    and m.sender_id = c.user_id
    and m.created_at > c.admin_last_read_at;
$$;

-- Uma linha por conversa que já tem mensagem: aluna, conteúdo, última mensagem
-- e quantas não-lidas. Os LATERAL usam o índice (conversation_id, created_at),
-- então cada conversa custa um lookup, em vez de varrer tudo e agrupar em JS.
create or replace function public.admin_inbox_rows()
returns table (
  id uuid,
  student_name text,
  content_title text,
  category text,
  last_message_body text,
  last_message_at timestamptz,
  unread integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    coalesce(p.name, 'Aluna'),
    coalesce(ct.title, ''),
    coalesce(ct.category, ''),
    lm.body,
    lm.created_at,
    coalesce(uc.unread, 0)::integer
  from public.conversations c
  left join public.profiles p on p.id = c.user_id
  left join public.contents ct on ct.id = c.content_id
  left join lateral (
    select body, created_at
    from public.conversation_messages
    where conversation_id = c.id
    order by created_at desc
    limit 1
  ) lm on true
  left join lateral (
    select count(*) as unread
    from public.conversation_messages
    where conversation_id = c.id
      and sender_id = c.user_id
      and created_at > c.admin_last_read_at
  ) uc on true
  where public.is_admin()
    and lm.created_at is not null
  order by lm.created_at desc;
$$;

-- Receita total = soma do preço dos conteúdos comprados. Era: baixar todas as
-- compras com o preço e somar em JS. Agora: um sum. Também restrito a admin,
-- que é quem vê o painel.
create or replace function public.admin_total_revenue()
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(ct.price), 0)
  from public.purchases pu
  join public.contents ct on ct.id = pu.content_id
  where public.is_admin();
$$;

commit;
