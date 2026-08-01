"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, avatarStyle } from "@/lib/utils";

export type AlunaRow = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  courseCount: number;
  totalSpent: number;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AlunasGrid({ rows }: { rows: AlunaRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="h-10 w-full rounded-xl border border-border/60 bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          {rows.length === 0
            ? "Nenhuma aluna cadastrada ainda."
            : "Nenhuma aluna encontrada pra essa busca."}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filtered.map((row) => (
            <Link
              key={row.id}
              href={`/admin/alunos/${row.id}`}
              className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-rose/40"
            >
              <Avatar size="lg" className="shrink-0">
                <AvatarFallback className={`text-sm font-medium ${avatarStyle(row.id)}`}>
                  {getInitials(row.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-heading text-base text-foreground group-hover:text-rose">
                    {row.name}
                  </p>
                  {row.courseCount === 0 && (
                    <span className="shrink-0 rounded-full border border-dashed border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                      Sem compras
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{row.email}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="size-3.5" />
                    {row.courseCount} curso{row.courseCount === 1 ? "" : "s"}
                  </span>
                  {row.totalSpent > 0 && (
                    <span className="font-medium text-foreground">
                      {formatCurrency(row.totalSpent)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {new Date(row.joinedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
