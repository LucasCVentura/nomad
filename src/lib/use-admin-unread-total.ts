"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAdminUnreadTotal } from "@/lib/conversations";

export function useAdminUnreadTotal(initial: number) {
  const [total, setTotal] = useState(initial);

  useEffect(() => {
    const supabase = createClient();
    let timeout: number | undefined;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;

    // Coalesce bursts (e.g. opening a thread bumps admin_last_read_at right
    // after the INSERT that triggered it) into a single refetch.
    function scheduleRefetch() {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(async () => {
        setTotal(await getAdminUnreadTotal(supabase));
      }, 300);
    }

    // Auth hydrates from cookies asynchronously — subscribing before that
    // finishes sends an unauthenticated request that RLS silently filters.
    supabase.auth.getSession().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel("admin-unread-total")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "conversation_messages" },
          scheduleRefetch
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "conversations" },
          scheduleRefetch
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return total;
}
