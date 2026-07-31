import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Cliente com a chave de serviço: passa por cima de toda a RLS.
 *
 * Só para o que precisa acontecer sem um usuário na frente — criar um pedido,
 * liberar o acesso quando o pagamento confirma. Nunca para responder algo que
 * veio do navegador sem antes checar de quem é a sessão, porque aqui não há
 * mais nenhuma trava do banco protegendo.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY não configurada");
  }
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
