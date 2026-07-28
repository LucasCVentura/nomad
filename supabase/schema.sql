-- Nomad — schema inicial
-- Rode este script inteiro no SQL Editor do Supabase (dashboard do projeto).

create extension if not exists "pgcrypto";

-- Profiles --------------------------------------------------------------
-- Espelha auth.users com campos próprios da aplicação (nome, admin).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  is_admin boolean not null default false,
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
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'name');
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

create policy "Published contents are public"
  on public.contents for select
  using (status = 'published' or public.is_admin());

create policy "Only admin can insert contents"
  on public.contents for insert
  with check (public.is_admin());

create policy "Only admin can update contents"
  on public.contents for update
  using (public.is_admin());

create policy "Only admin can delete contents"
  on public.contents for delete
  using (public.is_admin());

-- Purchases -----------------------------------------------------------------
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  -- references profiles (not auth.users) so PostgREST can embed
  -- purchases -> profiles in the same query (used by the admin dashboard).
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  purchased_at timestamptz not null default now(),
  unique (user_id, content_id)
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);

alter table public.purchases enable row level security;

create policy "Users see own purchases, admin sees all"
  on public.purchases for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can create own purchases"
  on public.purchases for insert
  with check (auth.uid() = user_id);

create policy "Users can update own purchase progress"
  on public.purchases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
-- content-images: imagens extraídas dos PDFs, públicas (aparecem no leitor).
-- content-pdfs: os PDFs originais enviados, privados (só a admin acessa).
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('content-pdfs', 'content-pdfs', false)
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

create policy "Only admin can access source pdfs"
  on storage.objects for select
  using (bucket_id = 'content-pdfs' and public.is_admin());

create policy "Only admin can upload source pdfs"
  on storage.objects for insert
  with check (bucket_id = 'content-pdfs' and public.is_admin());

create policy "Only admin can delete source pdfs"
  on storage.objects for delete
  using (bucket_id = 'content-pdfs' and public.is_admin());
