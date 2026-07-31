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

-- Community posts show the author's name to every signed-in reader, not
-- just to the profile owner/admin — this policy is additive to the one
-- above (RLS policies are OR'd), it doesn't replace it.
create policy "Signed-in users can view basic profile info"
  on public.profiles for select
  using (auth.uid() is not null);

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
  status text not null default 'draft' check (status in ('draft', 'published')),
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
  created_at
from public.contents
where status = 'published';

grant select on public.store_contents to anon, authenticated;

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
  paid_at timestamptz
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

-- Leitura apenas: a aluna acompanha os próprios pedidos, a admin vê todos.
-- Não há policy de insert/update/delete de propósito — pedido só nasce e muda
-- pelo servidor (service role), nunca pelo navegador, senão o pagamento seria
-- contornável do mesmo jeito que o checkout antigo era.
create policy "Users see own orders, admin sees all"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

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

create policy "Users manage their own annotations"
  on public.annotations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage ---------------------------------------------------------------------
-- content-images: imagens extraídas dos PDFs e capas de curso, públicas
-- (aparecem no leitor e na loja, inclusive pra quem não comprou ainda).
-- content-videos: vídeos anexados a um conteúdo, também públicos pelo mesmo
-- motivo — mesma lógica já aceita pras imagens (a URL não é divulgada fora
-- do conteúdo em si).
-- content-pdfs: os PDFs originais enviados, privados (só a admin acessa).
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('content-videos', 'content-videos', true, 524288000)
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

create policy "Public read of content videos"
  on storage.objects for select
  using (bucket_id = 'content-videos');

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
