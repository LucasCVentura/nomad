"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { timeAgo, getInitials, avatarStyle } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  senderName: string;
};

// Consecutive messages from the same sender within this window are grouped
// visually — one avatar/name for the whole run instead of repeating it per
// bubble, the way a real chat app reads. Wide enough to cover a burst of
// short messages typed a few seconds apart, narrow enough that a reply
// after a real gap still starts its own group.
const GROUP_WINDOW_MS = 5 * 60 * 1000;

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Jumps straight to the newest message — on first load and every time the
  // list grows — instead of leaving whoever opens a long conversation
  // stranded at the top of it. `scrollIntoView` finds whichever ancestor
  // actually scrolls (the reader's side panel, or the page itself in the
  // admin view), so this needs no knowledge of which context it's in.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // A textarea that grows with what's typed, up to a few lines, instead of
  // a fixed two rows that either wastes space empty or clips a longer
  // message behind a scrollbar.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [body]);

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, like every chat app; Shift+Enter is the escape hatch for
    // an actual line break.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-1">
        {messages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            {emptyStateLabel}
          </p>
        ) : (
          messages.map((message, i) => {
            const mine = message.senderId === currentUserId;
            const prev = messages[i - 1];
            const next = messages[i + 1];
            // A message opens a new group when it follows a different
            // sender or a real gap in time — that's when the avatar/name
            // repeat and the group gets its usual breathing room above it.
            const startsGroup =
              !prev ||
              prev.senderId !== message.senderId ||
              Date.parse(message.createdAt) - Date.parse(prev.createdAt) > GROUP_WINDOW_MS;
            const endsGroup =
              !next ||
              next.senderId !== message.senderId ||
              Date.parse(next.createdAt) - Date.parse(message.createdAt) > GROUP_WINDOW_MS;

            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${
                  startsGroup ? "pt-3" : ""
                }`}
              >
                {!mine && (
                  <Avatar
                    size="sm"
                    className={`shrink-0 ${endsGroup ? "" : "invisible"}`}
                  >
                    <AvatarFallback className={`font-medium ${avatarStyle(message.senderId)}`}>
                      {getInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex max-w-[75%] flex-col ${mine ? "items-end" : "items-start"}`}>
                  {!mine && startsGroup && (
                    <p className="mb-1 px-1 text-[11px] font-medium text-gold">
                      {message.senderName}
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? "bg-rose text-rose-foreground"
                        : "border border-border/60 bg-card text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
                  </div>
                  {endsGroup && (
                    <p className="mt-1 px-1 text-[10px] text-muted-foreground">
                      {timeAgo(message.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 mt-3 flex items-end gap-3 border-t border-border/60 bg-background/95 pt-3 backdrop-blur"
      >
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Escreva sua mensagem..."
          className="max-h-30 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring"
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
