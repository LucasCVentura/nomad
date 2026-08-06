-- ============================================================================
-- Patch 06/08/2026 — freio de escrita por usuário (anti-flood)
--
-- Auditoria de resiliência. As escritas da aluna (grifos/anotações e mensagens
-- de chat) vão do navegador direto ao PostgREST, sem passar pelo app Next, e
-- não havia limite nenhum: um teste inseriu 99 anotações num único burst
-- paralelo. Uma conta confirmada poderia inflar o banco (o plano tem teto de
-- tamanho) e degradar a performance — DoS por volume de dados.
--
-- Este é o único ponto do fluxo que dá para blindar por código; força bruta de
-- login, flood de e-mail e cadastro em massa são barrados pelo próprio Supabase
-- (rate limit por IP e confirmação de e-mail) e/ou dependem de CAPTCHA, que é
-- configuração de painel — ver AUDITORIA-RESILIENCIA.md.
--
-- O limite é por usuário e por janela de 1 minuto, com folga grande de
-- propósito: um humano grifando ou conversando nunca chega perto; um flood
-- automatizado bate na hora. A conta que passar do teto leva a inserção
-- recusada, e a transação inteira reverte (vale também para insert em lote).
--
-- service_role (webhook, admin) não tem auth.uid(), então passa livre — é o
-- que precisa continuar liberando acesso sem tropeçar no freio.
--
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
-- ============================================================================

begin;

-- Índices que tornam a contagem por janela barata (senão o trigger varreria a
-- tabela a cada insert). Cobrem exatamente o filtro do count abaixo.
create index if not exists annotations_user_created_idx
  on public.annotations (user_id, created_at);
create index if not exists conversation_messages_sender_created_idx
  on public.conversation_messages (sender_id, created_at);

-- Genérico: recebe o teto e o nome da coluna de dono como argumentos do
-- trigger, então serve para qualquer tabela com um dono e um created_at.
create or replace function public.enforce_insert_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  limite   integer := coalesce((tg_argv[0])::integer, 120);
  col_dono text    := tg_argv[1];
  usuario  uuid    := auth.uid();
  qtd      integer;
begin
  -- Sem sessão de usuário (service_role) não há o que limitar.
  if usuario is null then
    return new;
  end if;

  execute format(
    'select count(*) from public.%I where %I = $1 and created_at > now() - interval ''1 minute''',
    tg_table_name, col_dono
  ) into qtd using usuario;

  if qtd >= limite then
    raise exception 'Muitos registros em pouco tempo. Aguarde um instante e tente de novo.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists annotations_rate_limit on public.annotations;
create trigger annotations_rate_limit
  before insert on public.annotations
  for each row execute function public.enforce_insert_rate_limit('120', 'user_id');

drop trigger if exists conversation_messages_rate_limit on public.conversation_messages;
create trigger conversation_messages_rate_limit
  before insert on public.conversation_messages
  for each row execute function public.enforce_insert_rate_limit('60', 'sender_id');

commit;
