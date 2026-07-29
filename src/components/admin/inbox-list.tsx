"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAdminInboxRows, type AdminInboxRow } from "@/lib/conversations";
import { timeAgo } from "@/lib/utils";

export function AdminInboxList({ initialRows }: { initialRows: AdminInboxRow[] }) {
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    const supabase = createClient();
    let timeout: number | undefined;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;

    function scheduleRefetch() {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(async () => {
        setRows(await getAdminInboxRows(supabase));
      }, 300);
    }

    // Auth hydrates from cookies asynchronously — subscribing before that
    // finishes sends an unauthenticated request that RLS silently filters.
    supabase.auth.getSession().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel("admin-inbox")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "conversation_messages" },
          scheduleRefetch
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "conversations" },
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

  if (rows.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
        Nenhuma conversa ainda.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {rows.map((row) => (
        <Link
          key={row.id}
          href={`/admin/comunidade/${row.id}`}
          className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-rose/40"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 font-heading text-base text-foreground">
              {row.studentName}
              {row.unread > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-rose text-[10px] text-rose-foreground">
                  {row.unread}
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {timeAgo(row.lastMessageAt!)}
            </span>
          </div>
          <span className="text-[11px] font-medium tracking-wide text-gold uppercase">
            {row.contentTitle}
          </span>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{row.lastMessageBody}</p>
        </Link>
      ))}
    </div>
  );
}
