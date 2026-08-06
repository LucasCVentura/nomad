import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type AdminInboxRow = {
  id: string;
  studentName: string;
  contentTitle: string;
  category: string;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unread: number;
};

// Uma linha por conversa, agregada no banco (função admin_inbox_rows). Antes
// isto baixava TODAS as mensagens da plataforma e montava as linhas em JS —
// ~355 kB e 5.000 objetos com 5.000 mensagens de teste, a cada abertura da
// caixa de entrada. Agora o Postgres devolve só as linhas prontas.
export async function getAdminInboxRows(supabase: SupabaseClient<Database>): Promise<AdminInboxRow[]> {
  const { data } = await supabase.rpc("admin_inbox_rows");
  return (data ?? []).map((r) => ({
    id: r.id,
    studentName: r.student_name ?? "Aluna",
    contentTitle: r.content_title ?? "",
    category: r.category ?? "",
    lastMessageBody: r.last_message_body,
    lastMessageAt: r.last_message_at,
    unread: r.unread ?? 0,
  }));
}

export async function getConversationUnreadForUser(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  userId: string
) {
  const [{ data: conversation }, { data: messages }] = await Promise.all([
    supabase.from("conversations").select("user_last_read_at").eq("id", conversationId).maybeSingle(),
    supabase.from("conversation_messages").select("sender_id, created_at").eq("conversation_id", conversationId),
  ]);

  if (!conversation) return 0;
  return (messages ?? []).filter(
    (m) => m.sender_id !== userId && m.created_at > conversation.user_last_read_at
  ).length;
}

// Total de não-lidas somado no banco (função admin_unread_total). Isto roda no
// layout do admin e re-executa a cada mensagem nova via Realtime, então era o
// pior dos três: baixava o histórico inteiro de mensagens toda vez. Agora é um
// count que devolve um número.
export async function getAdminUnreadTotal(supabase: SupabaseClient<Database>) {
  const { data } = await supabase.rpc("admin_unread_total");
  return data ?? 0;
}
