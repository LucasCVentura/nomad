import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { ChatThread, type ChatMessage } from "@/components/chat/chat-thread";
import { getInitials, avatarStyle } from "@/lib/utils";

export default async function AdminConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    notFound();
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, content_id, profiles(name), contents(title)")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) {
    notFound();
  }

  const { data: rows } = await supabase
    .from("conversation_messages")
    .select("id, body, created_at, sender_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const studentName = conversation.profiles?.name ?? "Aluna";
  const messages: ChatMessage[] = (rows ?? []).map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    senderId: r.sender_id,
    senderName: r.sender_id === session.user.id ? "Você" : studentName,
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <Link
        href="/admin/comunidade"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Conversas
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <Avatar size="lg" className="shrink-0">
          <AvatarFallback className={`text-sm font-medium ${avatarStyle(conversation.id)}`}>
            {getInitials(studentName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-2xl text-foreground">{studentName}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{conversation.contents?.title}</p>
        </div>
      </div>

      <ChatThread
        conversationId={conversation.id}
        contentId={conversation.content_id}
        currentUserId={session.user.id}
        otherPartyName={studentName}
        initialMessages={messages}
        emptyStateLabel="Nenhuma mensagem ainda."
      />
    </div>
  );
}
