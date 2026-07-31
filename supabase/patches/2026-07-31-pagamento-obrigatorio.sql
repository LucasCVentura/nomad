-- ============================================================================
-- Patch 31/07/2026 — fecha o item 2b: só o pagamento libera o acesso
--
-- Até aqui a policy de insert em `purchases` permitia `auth.uid() = user_id`,
-- ou seja, a própria aluna criava a própria compra. Fazia sentido enquanto o
-- checkout liberava na hora sem cobrar; agora que existe pagamento de verdade,
-- deixar isso seria o mesmo que não ter gateway — bastaria um POST para
-- liberar qualquer curso de graça.
--
-- Quem passa a inserir:
--   - o webhook do Asaas, com a service role (ignora RLS por natureza);
--   - a Dra., liberando na mão pelo painel de alunas (is_admin).
--
-- Rode uma vez no SQL Editor. Já está incorporado ao schema.sql.
-- ============================================================================

begin;

drop policy if exists "Users can create own purchases, admin can grant any" on public.purchases;
drop policy if exists "Only admin can grant a purchase" on public.purchases;

create policy "Only admin can grant a purchase"
  on public.purchases for insert
  with check (public.is_admin());

commit;
