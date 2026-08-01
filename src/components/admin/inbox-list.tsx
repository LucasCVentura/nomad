"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { getAdminInboxRows, type AdminInboxRow } from "@/lib/conversations";
import { timeAgo, getInitials, avatarStyle } from "@/lib/utils";

export function AdminInboxList({ initialRows }: { initialRows: AdminInboxRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) || r.contentTitle.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const unreadTotal = rows.reduce((sum, r) => sum + r.unread, 0);
  const unreadConversations = rows.filter((r) => r.unread > 0).length;

  if (rows.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
        Nenhuma conversa ainda.
      </p>
    );
  }

  return (
    <div className="mt-8">
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="font-heading text-2xl text-foreground">{rows.length}</p>
          <p className="text-sm text-muted-foreground">Conversas</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="font-heading text-2xl text-foreground">{unreadConversations}</p>
          <p className="text-sm text-muted-foreground">Conversas não lidas</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className={`font-heading text-2xl ${unreadTotal > 0 ? "text-rose" : "text-foreground"}`}>
            {unreadTotal}
          </p>
          <p className="text-sm text-muted-foreground">Mensagens não lidas</p>
        </div>
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por aluna ou conteúdo..."
          className="h-10 w-full rounded-xl border border-border/60 bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhuma conversa encontrada pra essa busca.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((row) => (
            <Link
              key={row.id}
              href={`/admin/comunidade/${row.id}`}
              className={`flex items-start gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-rose/40 ${
                row.unread > 0 ? "border-rose/30" : "border-border/60"
              }`}
            >
              <Avatar size="lg" className="shrink-0">
                <AvatarFallback className={`text-sm font-medium ${avatarStyle(row.id)}`}>
                  {getInitials(row.studentName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
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
                <p
                  className={`mt-1 line-clamp-1 text-sm ${
                    row.unread > 0 ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {row.lastMessageBody}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
