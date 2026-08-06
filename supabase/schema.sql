-- Nomad — schema inicial
-- Rode este script inteiro no SQL Editor do Supabase (dashboard do projeto).

create extension if not exists "pgcrypto";

-- Profiles --------------------------------------------------------------
-- Espelha auth.users com campos próprios da aplicação (nome, admin).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  is_admin boolean not null default false,
  -- Exigido pelo Asaas para criar o cliente; pedido uma vez, na primeira
  -- compra. O id do cliente fica junto para não recriar a cada pedido.
  cpf text,
  asaas_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cria a linha em profiles automaticamente quando alguém se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Função auxiliar usada pelas policies abaixo pra checar se quem está
-- fazendo a requisição é a admin (Dra. Nathalia).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create policy "Profiles are viewable by owner or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- NÃO reintroduzir aqui uma policy do tipo `using (auth.uid() is not null)`.
-- Existiu uma, de quando a "comunidade" era um fórum público e cada post
-- mostrava o nome do autor. O fórum virou chat privado 1:1 e a policy ficou
-- órfã — mas continuou liberando a LINHA INTEIRA de profiles para qualquer
-- sessão autenticada, ou seja, e-mail, cpf e asaas_customer_id de todas as
-- alunas (auditoria de 06/08/2026). RLS é por linha, não por coluna: se um
-- dia for preciso expor só o nome, faça uma view com as colunas públicas.
create policy "Only admin can update profiles"
  on public.profiles for update
  using (public.is_admin());

-- Contents ----------------------------------------------------------------
-- Cada material/curso publicado pela Dra. Nathalia.
create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null,
  format text not null default 'PDF',
  pages integer,
  price numeric(10, 2) not null default 0,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'coming_soon')),
  body jsonb not null default '[]'::jsonb,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contents_status_idx on public.contents (status);

alter table public.contents enable row level security;

-- `body` is the product itself (the page images and the text of the course),
-- and RLS is row-level: a policy that let anyone read a published row handed
-- the whole course to anyone holding the anon key, no account needed. So the
-- table is readable only by whoever bought it (or the admin), and the
-- storefront reads `store_contents` below instead — same split already used
-- for platform_stats/public_reviews.
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

create policy "Only admin can insert contents"
  on public.contents for insert
  with check (public.is_admin());

create policy "Only admin can update contents"
  on public.contents for update
  using (public.is_admin());

create policy "Only admin can delete contents"
  on public.contents for delete
  using (public.is_admin());

-- Storefront metadata: everything the landing page and the store need to sell
-- a content, and nothing of the content itself. Runs with the owner's
-- privileges (security_invoker = false), so it sees past the table's RLS
-- while exposing only the columns listed here — `body` is not one of them.
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

grant select on public.store_contents to anon, authenticated;

-- Só SELECT, e o revoke abaixo é obrigatório, não zelo excessivo: esta view é
-- simples, então o Postgres a torna AUTO-ATUALIZÁVEL, e como ela roda com o
-- privilégio do dono (security_invoker = false) um INSERT/UPDATE/DELETE nela
-- vira escrita em `contents` por cima da RLS. Auditoria de 06/08/2026: sem
-- login algum dava para criar produto na loja, alterar preço e apagar curso.
revoke insert, update, delete, truncate, references
  on public.store_contents from anon, authenticated;

-- Purchases -----------------------------------------------------------------
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  -- references profiles (not auth.users) so PostgREST can embed
  -- purchases -> profiles in the same query (used by the admin dashboard).
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  completed_at timestamptz,
  -- Compared against contents.updated_at to show an "atualizado" badge —
  -- defaults to now() so pre-existing purchases don't retroactively flag
  -- as updated for edits that happened before this column existed.
  updated_seen_at timestamptz not null default now(),
  purchased_at timestamptz not null default now(),
  -- Asked once, right after the student marks the content as completed.
  rating integer check (rating between 1 and 5),
  review text,
  unique (user_id, content_id)
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);

alter table public.purchases enable row level security;

create policy "Users see own purchases, admin sees all"
  on public.purchases for select
  using (auth.uid() = user_id or public.is_admin());

-- Só a admin insere direto (liberando na mão pelo painel de alunas). A compra
-- normal entra pelo webhook do Asaas, com a service role — se a aluna pudesse
-- criar a própria compra, bastaria um POST para pular o pagamento.
create policy "Only admin can grant a purchase"
  on public.purchases for insert
  with check (public.is_admin());

create policy "Only admin can revoke a purchase"
  on public.purchases for delete
  using (public.is_admin());

create policy "Users can update own purchase progress"
  on public.purchases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- The policy above only scopes the *row*, so on its own it also let a student
-- rewrite any column of her own purchase — including content_id, swapping the
-- cheap content she paid for for an expensive one. Column grants are what
-- narrow it down to the fields she legitimately moves.
revoke update on public.purchases from anon, authenticated;
grant update (progress, completed_at, updated_seen_at, rating, review)
  on public.purchases to authenticated;

-- Two narrow, read-only views so the public landing page can show real
-- numbers/testimonials without opening up RLS on `purchases` itself (which
-- would let anon read every student's raw progress/user_id). Views run with
-- the owner's privileges (security_invoker = false), so they see past the
-- table's RLS the same way a service-role query would, but only expose the
-- specific columns defined here.
create or replace view public.platform_stats
with (security_invoker = false) as
select
  (select count(*) from public.contents where status = 'published') as materials_count,
  (select count(distinct user_id) from public.purchases) as professionals_count,
  (select round(avg(rating)::numeric, 1) from public.purchases where rating is not null) as avg_rating,
  (select count(*) from public.purchases where rating is not null) as rating_count;

grant select on public.platform_stats to anon, authenticated;

create or replace view public.public_reviews
with (security_invoker = false) as
select
  p.id,
  p.rating,
  p.review,
  c.title as content_title,
  c.category as content_category,
  p.purchased_at
from public.purchases p
join public.contents c on c.id = p.content_id
where p.review is not null
  and length(trim(p.review)) > 0
  and p.rating >= 4
order by p.purchased_at desc;

grant select on public.public_reviews to anon, authenticated;

-- Orders --------------------------------------------------------------------
-- Um pedido = uma cobrança no Asaas. O carrinho pode levar vários cursos e a
-- cobrança tem um valor só, então `order_items` guarda o que ela cobre.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Único: o webhook do Asaas reenvia o mesmo evento até receber 200, e é por
  -- este id que a segunda entrega é reconhecida como repetida.
  asaas_payment_id text unique,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'canceled', 'refunded')),
  total numeric(10, 2) not null,
  invoice_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  -- Pedido de reembolso (direito de arrependimento do CDC, Termos seção 5).
  -- Só registra o pedido; quem aprova e efetiva é a Dra., na mão, no painel
  -- da Asaas — a cláusula fala em "acesso substancial", que não dá pra
  -- automatizar.
  refund_requested_at timestamptz
);

create index if not exists orders_user_id_idx on public.orders (user_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete restrict,
  -- Preço no momento da compra: mudar o preço do curso depois não pode
  -- reescrever o histórico do que já foi pago.
  price numeric(10, 2) not null,
  unique (order_id, content_id)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Leitura: a aluna acompanha os próprios pedidos, a admin vê todos. Sem
-- policy de insert/delete de propósito — pedido só nasce e é apagado pelo
-- servidor (service role), nunca pelo navegador, senão o pagamento seria
-- contornável do mesmo jeito que o checkout antigo era.
create policy "Users see own orders, admin sees all"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

-- A única escrita que o navegador pode fazer em orders: pedir reembolso do
-- próprio pedido pago. O grant de coluna logo abaixo é quem impede isso de
-- virar "reescrever o total" — sem ele, todo UPDATE que a policy libera
-- valeria para qualquer coluna.
revoke update on public.orders from anon, authenticated;
grant update (refund_requested_at) on public.orders to authenticated;

create policy "Users can request a refund on their own paid order"
  on public.orders for update
  using (auth.uid() = user_id and status = 'paid')
  with check (auth.uid() = user_id and status = 'paid');

create policy "Users see own order items, admin sees all"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- Annotations -----------------------------------------------------------------
create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  paragraph_id text not null,
  start_offset integer not null,
  end_offset integer not null,
  text text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists annotations_user_content_idx
  on public.annotations (user_id, content_id);

alter table public.annotations enable row level security;

-- USING só na posse, para ela sempre conseguir ler e apagar as próprias
-- anotações mesmo que perca o acesso ao conteúdo depois; a checagem de acesso
-- fica no WITH CHECK, que governa INSERT/UPDATE — sem ela dava para gravar
-- anotação apontando para qualquer conteúdo, comprado ou não.
create policy "Users manage their own annotations"
  on public.annotations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and public.has_content_access(content_id));

-- Storage ---------------------------------------------------------------------
-- content-images: imagens extraídas dos PDFs e capas de curso, públicas
-- (aparecem no leitor e na loja, inclusive pra quem não comprou ainda).
-- content-videos: vídeos anexados a um conteúdo — PRIVADO. Já foi público,
-- sob o argumento de que a URL não circula fora do conteúdo; a auditoria de
-- 06/08/2026 derrubou o argumento: a pasta é o slug, que é público, então o
-- endereço era adivinhável — e vídeo de curso é produto pago. Segue o mesmo
-- desenho de content-pages: privado + URL assinada por leitura.
-- content-pdfs: os PDFs originais enviados, privados (só a admin acessa).
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('content-videos', 'content-videos', false, 524288000)
on conflict (id) do nothing;

-- Tetos por arquivo: o mesmo limite que o app aplica antes de converter, para
-- a falha ser igual dos dois lados em vez de depender do limite global do
-- projeto (que pode mudar no dashboard sem ninguém notar).
insert into storage.buckets (id, name, public, file_size_limit)
values ('content-pdfs', 'content-pdfs', false, 52428800)
on conflict (id) do nothing;

-- content-pages: cada página do PDF convertida em imagem. É o produto pago,
-- então o bucket é privado e o app assina as URLs na hora de renderizar —
-- num bucket público bastaria montar a URL a partir do slug (que é público)
-- para baixar o curso inteiro, página por página.
insert into storage.buckets (id, name, public, file_size_limit)
values ('content-pages', 'content-pages', false, 10485760)
on conflict (id) do nothing;

create policy "Public read of content images"
  on storage.objects for select
  using (bucket_id = 'content-images');

create policy "Only admin can upload content images"
  on storage.objects for insert
  with check (bucket_id = 'content-images' and public.is_admin());

create policy "Only admin can update content images"
  on storage.objects for update
  using (bucket_id = 'content-images' and public.is_admin());

create policy "Only admin can delete content images"
  on storage.objects for delete
  using (bucket_id = 'content-images' and public.is_admin());

-- O `or c.id::text` cobre vídeos salvos sob o id do conteúdo: a tela de edição
-- usava essa convenção enquanto a de criação usava o slug. O código foi
-- padronizado no slug, mas aceitar as duas evita vídeo ilegível por isso.
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

create policy "Only admin can upload content videos"
  on storage.objects for insert
  with check (bucket_id = 'content-videos' and public.is_admin());

create policy "Only admin can update content videos"
  on storage.objects for update
  using (bucket_id = 'content-videos' and public.is_admin());

create policy "Only admin can delete content videos"
  on storage.objects for delete
  using (bucket_id = 'content-videos' and public.is_admin());

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

create policy "Only admin can access source pdfs"
  on storage.objects for select
  using (bucket_id = 'content-pdfs' and public.is_admin());

create policy "Only admin can upload source pdfs"
  on storage.objects for insert
  with check (bucket_id = 'content-pdfs' and public.is_admin());

create policy "Only admin can delete source pdfs"
  on storage.objects for delete
  using (bucket_id = 'content-pdfs' and public.is_admin());

-- Conversas ----------------------------------------------------------------
-- Canal privado entre uma aluna e a Dra. Nathalia (admin), um por conteúdo
-- comprado. Não é um fórum público — só a própria aluna e o admin veem.
create or replace function public.has_content_access(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.purchases
    where purchases.content_id = cid and purchases.user_id = auth.uid()
  );
$$;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Read markers, one per side of the conversation. Default far in the past
  -- so a freshly created conversation's first message counts as unread for
  -- whichever side didn't send it.
  user_last_read_at timestamptz not null default '-infinity',
  admin_last_read_at timestamptz not null default '-infinity',
  unique (user_id, content_id)
);

alter table public.conversations enable row level security;

create policy "Owner or admin can read a conversation"
  on public.conversations for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users with access to the content can start a conversation"
  on public.conversations for insert
  with check (auth.uid() = user_id and public.has_content_access(content_id));

-- Security definer so it can update the read marker without a broad UPDATE
-- policy on the table; it still only touches the caller's own side.
create or replace function public.mark_conversation_read(cid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    user_last_read_at = case when user_id = auth.uid() then now() else user_last_read_at end,
    admin_last_read_at = case when public.is_admin() then now() else admin_last_read_at end
  where id = cid
  and (user_id = auth.uid() or public.is_admin());
end;
$$;

-- Agregações do painel admin, feitas no banco (auditoria de performance,
-- 06/08/2026). Antes, três telas baixavam tabelas inteiras para o servidor e
-- somavam/contavam em JS — o total de não-lidas, que re-executa a cada
-- mensagem via Realtime, era o pior. Estas devolvem só o resultado. São
-- admin-only pela checagem interna de is_admin(): quem não é admin recebe
-- zero/vazio mesmo chamando via RPC.
create or replace function public.admin_unread_total()
returns integer language sql security definer set search_path = public stable
as $$
  select count(*)::integer
  from public.conversation_messages m
  join public.conversations c on c.id = m.conversation_id
  where public.is_admin()
    and m.sender_id = c.user_id
    and m.created_at > c.admin_last_read_at;
$$;

create or replace function public.admin_inbox_rows()
returns table (
  id uuid, student_name text, content_title text, category text,
  last_message_body text, last_message_at timestamptz, unread integer
)
language sql security definer set search_path = public stable
as $$
  select
    c.id, coalesce(p.name, 'Aluna'), coalesce(ct.title, ''),
    coalesce(ct.category, ''), lm.body, lm.created_at, coalesce(uc.unread, 0)::integer
  from public.conversations c
  left join public.profiles p on p.id = c.user_id
  left join public.contents ct on ct.id = c.content_id
  left join lateral (
    select body, created_at from public.conversation_messages
    where conversation_id = c.id order by created_at desc limit 1
  ) lm on true
  left join lateral (
    select count(*) as unread from public.conversation_messages
    where conversation_id = c.id and sender_id = c.user_id
      and created_at > c.admin_last_read_at
  ) uc on true
  where public.is_admin() and lm.created_at is not null
  order by lm.created_at desc;
$$;

create or replace function public.admin_total_revenue()
returns numeric language sql security definer set search_path = public stable
as $$
  select coalesce(sum(ct.price), 0)
  from public.purchases pu
  join public.contents ct on ct.id = pu.content_id
  where public.is_admin();
$$;

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversation_messages_conversation_id_idx
  on public.conversation_messages (conversation_id, created_at);

alter table public.conversation_messages enable row level security;

create policy "Owner or admin can read messages"
  on public.conversation_messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = conversation_messages.conversation_id
      and (conversations.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Owner or admin can send messages"
  on public.conversation_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where conversations.id = conversation_messages.conversation_id
      and (conversations.user_id = auth.uid() or public.is_admin())
    )
  );

-- Lets the chat push new messages to an open thread over websockets instead
-- of requiring a reload. Postgres Changes still enforces the select policy
-- above per-subscriber, so a client only receives inserts for conversations
-- they can actually read.
alter publication supabase_realtime add table public.conversation_messages;

-- Also needed so the admin's unread badges (sidebar total + inbox list) can
-- react live: new messages bump them, and admin_last_read_at updates (from
-- opening a thread) clear them, without a page reload.
alter publication supabase_realtime add table public.conversations;

-- Freio de escrita (anti-flood) --------------------------------------------
-- As escritas da aluna vão do navegador direto ao PostgREST, sem passar pelo
-- app, e a RLS controla QUEM escreve, não QUANTO. Sem isto, uma conta
-- confirmada inseria centenas de anotações/mensagens por segundo e podia
-- inflar o banco (auditoria de resiliência, 06/08/2026). O teto é por usuário
-- e por minuto, com folga: um humano nunca alcança, um flood bate na hora.
-- service_role não tem auth.uid(), então o webhook e o admin passam livres.
create index if not exists annotations_user_created_idx
  on public.annotations (user_id, created_at);
create index if not exists conversation_messages_sender_created_idx
  on public.conversation_messages (sender_id, created_at);

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

create trigger annotations_rate_limit
  before insert on public.annotations
  for each row execute function public.enforce_insert_rate_limit('120', 'user_id');

create trigger conversation_messages_rate_limit
  before insert on public.conversation_messages
  for each row execute function public.enforce_insert_rate_limit('60', 'sender_id');
