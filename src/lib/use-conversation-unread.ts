"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getConversationUnreadForUser } from "@/lib/conversations";

// Tracks unread count for one conversation independent of whether any chat
// UI for it is currently mounted — a reader panel that's closed still needs
// to know a reply arrived, not just the open ChatThread.
export function useConversationUnread(
  conversationId: string | null,
  userId: string,
  initial: number
) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();
    let timeout: number | undefined;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;

    function scheduleRefetch() {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(async () => {
        setCount(await getConversationUnreadForUser(supabase, conversationId!, userId));
      }, 300);
    }

    // Auth hydrates from cookies asynchronously — subscribing before that
    // finishes sends an unauthenticated request that RLS silently filters.
    supabase.auth.getSession().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`conversation-unread-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "conversation_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          scheduleRefetch
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "conversations",
            filter: `id=eq.${conversationId}`,
          },
          scheduleRefetch
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  return count;
}
