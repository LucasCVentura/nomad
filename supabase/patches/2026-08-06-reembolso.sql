-- ============================================================================
-- Patch 06/08/2026 — solicitação de reembolso
--
-- Os Termos de Uso (seção 5) já prometem o direito de arrependimento do CDC
-- (7 dias corridos, se o conteúdo não foi acessado de forma substancial), e o
-- schema.sql já previa o estado 'refunded' em orders.status. Faltava o
-- MECANISMO: onde a aluna solicita, e onde a Dra. vê o pedido.
--
-- Como a cláusula fala em "acesso substancial", a aprovação não é automática
-- — é julgamento da Dra. (o comentário do webhook já dizia isso: "estorno
-- costuma vir com conversa"). Esta coluna só registra o pedido; quem efetiva
-- o dinheiro é a Dra., na mão, no painel da Asaas, e o webhook já pega a
-- confirmação sozinho quando isso acontece.
--
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
-- ============================================================================

begin;

alter table public.orders
  add column if not exists refund_requested_at timestamptz;

-- IMPORTANTE: orders tinha TODAS as colunas liberadas para UPDATE a nível de
-- coluna (auditoria de RLS, 06/08/2026) — inofensivo até agora porque não
-- existia nenhuma policy de UPDATE (a RLS bloqueava tudo, então o grant de
-- coluna nunca chegava a valer). Adicionar a policy abaixo SEM antes apertar
-- os grants deixaria a aluna reescrever total/status/asaas_payment_id do
-- próprio pedido. Por isso o revoke vem primeiro, igual ao padrão já usado em
-- purchases (schema.sql, "Users can update own purchase progress").
revoke update on public.orders from anon, authenticated;
grant update (refund_requested_at) on public.orders to authenticated;

-- Só o próprio pedido, só enquanto ele está pago — pedido pendente não tem o
-- que reembolsar, e um já reembolsado/cancelado não deveria ser reaberto por
-- aqui (a Dra. reabre na mão se for o caso).
create policy "Users can request a refund on their own paid order"
  on public.orders for update
  using (auth.uid() = user_id and status = 'paid')
  with check (auth.uid() = user_id and status = 'paid');

commit;
