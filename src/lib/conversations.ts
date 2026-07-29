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

export async function getAdminInboxRows(supabase: SupabaseClient<Database>): Promise<AdminInboxRow[]> {
  const [{ data: conversations }, { data: messages }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, user_id, admin_last_read_at, profiles(name), contents(title, category)"),
    supabase
      .from("conversation_messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const byConversation = new Map<string, typeof messages>();
  for (const m of messages ?? []) {
    const list = byConversation.get(m.conversation_id) ?? [];
    list.push(m);
    byConversation.set(m.conversation_id, list);
  }

  const rows = (conversations ?? [])
    .map((c) => {
      const convMessages = byConversation.get(c.id) ?? [];
      const last = convMessages[0] ?? null;
      const unread = convMessages.filter(
        (m) => m.sender_id === c.user_id && m.created_at > c.admin_last_read_at
      ).length;
      return {
        id: c.id,
        studentName: c.profiles?.name ?? "Aluna",
        contentTitle: c.contents?.title ?? "",
        category: c.contents?.category ?? "",
        lastMessageBody: last?.body ?? null,
        lastMessageAt: last?.created_at ?? null,
        unread,
      };
    })
    .filter((r) => r.lastMessageAt !== null)
    .sort((a, b) => (a.lastMessageAt! < b.lastMessageAt! ? 1 : -1));

  return rows;
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

export async function getAdminUnreadTotal(supabase: SupabaseClient<Database>) {
  const [{ data: conversations }, { data: messages }] = await Promise.all([
    supabase.from("conversations").select("id, user_id, admin_last_read_at"),
    supabase.from("conversation_messages").select("conversation_id, sender_id, created_at"),
  ]);

  const byId = new Map((conversations ?? []).map((c) => [c.id, c]));
  let total = 0;
  for (const m of messages ?? []) {
    const conv = byId.get(m.conversation_id);
    if (conv && m.sender_id === conv.user_id && m.created_at > conv.admin_last_read_at) {
      total++;
    }
  }
  return total;
}
