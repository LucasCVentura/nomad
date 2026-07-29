import { notFound, redirect } from "next/navigation";
import { ReaderView } from "@/components/reader/reader-view";
import { createClient } from "@/lib/supabase/server";
import type { ContentBlock } from "@/lib/supabase/types";
import type { ChatMessage } from "@/components/chat/chat-thread";

export default async function LerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Independent lookups run in parallel instead of one-after-another.
  const [
    {
      data: { session },
    },
    { data: row },
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from("contents").select("id, title, category, body").eq("slug", slug).maybeSingle(),
  ]);

  if (!session) {
    redirect(`/entrar?next=/app/ler/${slug}`);
  }

  if (!row) {
    notFound();
  }

  const [{ data: purchase }, { data: profile }] = await Promise.all([
    supabase
      .from("purchases")
      .select("id, completed_at")
      .eq("user_id", session.user.id)
      .eq("content_id", row.id)
      .maybeSingle(),
    supabase.from("profiles").select("is_admin").eq("id", session.user.id).single(),
  ]);

  // The admin can always open any content to see it exactly as a student
  // would — otherwise she'd never be able to preview what she just
  // published, since she hasn't "purchased" her own material.
  if (!purchase && !profile?.is_admin) {
    redirect("/app/loja");
  }

  // Opening the content she actually bought counts as having seen whatever
  // update triggered the "conteúdo atualizado" badge on her dashboard.
  if (purchase) {
    await supabase
      .from("purchases")
      .update({ updated_seen_at: new Date().toISOString() })
      .eq("id", purchase.id);
  }

  // Reached via the admin-only bypass (no real purchase) → she almost
  // certainly got here from the admin content list, so "back" should
  // return her there instead of to the student dashboard.
  const backHref = !purchase && profile?.is_admin ? "/admin/conteudos" : "/app";

  // Chat with Dra. Nathalia only makes sense for an actual purchaser — the
  // admin-preview bypass has no purchase, and she'd otherwise be shown a
  // conversation with herself.
  let chat:
    | { conversationId: string | null; currentUserId: string; initialMessages: ChatMessage[]; unreadCount: number }
    | undefined;
  if (purchase) {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, user_last_read_at")
      .eq("user_id", session.user.id)
      .eq("content_id", row.id)
      .maybeSingle();

    let messages: ChatMessage[] = [];
    let unreadCount = 0;
    if (conversation) {
      const { data: rows } = await supabase
        .from("conversation_messages")
        .select("id, body, created_at, sender_id")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      messages = (rows ?? []).map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.created_at,
        senderId: r.sender_id,
        senderName: r.sender_id === session.user.id ? "Você" : "Dra. Nathalia",
      }));
      unreadCount = messages.filter(
        (m) => m.senderId !== session.user.id && m.createdAt > conversation.user_last_read_at
      ).length;
    }

    chat = {
      conversationId: conversation?.id ?? null,
      currentUserId: session.user.id,
      initialMessages: messages,
      unreadCount,
    };
  }

  return (
    <ReaderView
      content={{ title: row.title, category: row.category }}
      blocks={row.body as ContentBlock[]}
      contentId={row.id}
      backHref={backHref}
      chat={chat}
      initialCompleted={Boolean(purchase?.completed_at)}
    />
  );
}
