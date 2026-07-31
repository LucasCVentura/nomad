-- ============================================================================
-- Patch 31/07/2026 — pedidos e cobrança pelo Asaas
--
-- O carrinho pode levar vários cursos, mas uma cobrança no Asaas tem um valor
-- só. `orders` é esse vínculo: um pedido = uma cobrança, com os cursos que ela
-- cobre em `order_items`. O acesso continua saindo de `purchases`, criado só
-- quando o webhook confirma o pagamento.
--
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
--
-- NOTA: este patch ainda NÃO fecha o item 2b (a aluna criando a própria
-- compra). Isso sai no patch final, junto com a virada do checkout — tirar
-- antes deixaria ninguém comprando enquanto o fluxo novo não está pronto.
-- ============================================================================

begin;

-- CPF é obrigatório para criar o cliente no Asaas; pedido uma vez, na primeira
-- compra, e guardado para as próximas. O id do cliente no Asaas fica junto
-- para não recriar a cada pedido.
alter table public.profiles add column if not exists cpf text;
alter table public.profiles add column if not exists asaas_customer_id text;

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

commit;
