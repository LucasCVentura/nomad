"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  senderName: string;
};

export function ChatThread({
  conversationId,
  contentId,
  currentUserId,
  otherPartyName,
  initialMessages,
  emptyStateLabel,
  onConversationCreated,
}: {
  conversationId: string | null;
  contentId: string;
  currentUserId: string;
  otherPartyName: string;
  initialMessages: ChatMessage[];
  emptyStateLabel: string;
  onConversationCreated?: (id: string) => void;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [threadId, setThreadId] = useState(conversationId);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // The panel this lives in unmounts on close, so `conversationId` can be a
  // stale prop from before a conversation existed (e.g. it was created
  // during a previous mount) — sync it in whenever the parent catches up.
  useEffect(() => {
    setThreadId(conversationId);
  }, [conversationId]);

  // Opening the thread counts as reading it — clears the unread badge for
  // whichever side (student or admin) is looking at it. Supabase's query
  // builders are lazy thenables — the request never actually fires unless
  // something calls .then()/await on them.
  useEffect(() => {
    if (!threadId) return;
    const supabase = createClient();
    supabase.rpc("mark_conversation_read", { cid: threadId }).then(() => {});
  }, [threadId]);

  // The panel unmounts on close (it's inside a Sheet), so `initialMessages`
  // is only fresh the very first time it's opened after a page load — any
  // reply that arrived while it was closed is missing from that prop.
  // Refetch the authoritative list on every mount instead of trusting it.
  useEffect(() => {
    if (!threadId) return;
    const supabase = createClient();
    let cancelled = false;
    supabase
      .from("conversation_messages")
      .select("id, body, created_at, sender_id")
      .eq("conversation_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (cancelled || !data) return;
        setMessages(
          data.map((r) => ({
            id: r.id,
            body: r.body,
            createdAt: r.created_at,
            senderId: r.sender_id,
            senderName: r.sender_id === currentUserId ? "Você" : otherPartyName,
          }))
        );
      });
    return () => {
      cancelled = true;
    };
  }, [threadId, currentUserId, otherPartyName]);

  // Live updates: while the thread is open, new messages from the other
  // side show up without a reload. RLS on conversation_messages still
  // applies, so this only ever delivers rows the viewer can read.
  useEffect(() => {
    if (!threadId) return;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;

    supabase.auth.getSession().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`conversation-${threadId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "conversation_messages",
            filter: `conversation_id=eq.${threadId}`,
          },
          (payload) => {
            const row = payload.new as {
              id: string;
              body: string;
              created_at: string;
              sender_id: string;
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              return [
                ...prev,
                {
                  id: row.id,
                  body: row.body,
                  createdAt: row.created_at,
                  senderId: row.sender_id,
                  senderName: row.sender_id === currentUserId ? "Você" : otherPartyName,
                },
              ];
            });
            if (row.sender_id !== currentUserId) {
              supabase.rpc("mark_conversation_read", { cid: threadId }).then(() => {});
            }
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [threadId, currentUserId, otherPartyName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const supabase = createClient();

    let convId = threadId;
    if (!convId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: currentUserId, content_id: contentId })
        .select("id")
        .single();
      if (error || !data) {
        setSending(false);
        return;
      }
      convId = data.id;
      setThreadId(convId);
      onConversationCreated?.(convId);
    }

    const { data: message, error } = await supabase
      .from("conversation_messages")
      .insert({ conversation_id: convId, sender_id: currentUserId, body: trimmed })
      .select("id, body, created_at")
      .single();

    setSending(false);
    if (!error && message) {
      setMessages((prev) => [
        ...prev,
        {
          id: message.id,
          body: message.body,
          createdAt: message.created_at,
          senderId: currentUserId,
          senderName: "Você",
        },
      ]);
      setBody("");
      await supabase.rpc("mark_conversation_read", { cid: convId });
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-3">
        {messages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            {emptyStateLabel}
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "bg-rose text-rose-foreground"
                      : "border border-border/60 bg-card text-foreground"
                  }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-[11px] font-medium text-gold">
                      {message.senderName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
                  <p
                    className={`mt-1 text-[10px] ${mine ? "text-rose-foreground/70" : "text-muted-foreground"}`}
                  >
                    {timeAgo(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex items-end gap-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Escreva sua mensagem..."
          className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring"
        />
        <Button
          type="submit"
          size="sm"
          disabled={sending || !body.trim()}
          className="bg-rose text-rose-foreground hover:bg-rose/90"
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}
