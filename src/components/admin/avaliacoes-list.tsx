"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, avatarStyle } from "@/lib/utils";

export type ReviewRow = {
  id: string;
  rating: number;
  review: string | null;
  studentId: string;
  studentName: string;
  contentId: string;
  contentTitle: string;
  date: string;
};

function Stars({ value, className = "size-3.5" }: { value: number; className?: string }) {
  return (
    <span className="flex gap-0.5 text-gold">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${className} ${
            i < Math.round(value) ? "fill-current" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </span>
  );
}

export function AvaliacoesList({ reviews }: { reviews: ReviewRow[] }) {
  const contents = useMemo(() => {
    const byContent = new Map<string, { title: string; total: number; count: number }>();
    for (const r of reviews) {
      const entry = byContent.get(r.contentId) ?? { title: r.contentTitle, total: 0, count: 0 };
      entry.total += r.rating;
      entry.count += 1;
      byContent.set(r.contentId, entry);
    }
    return [...byContent.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total / b.count - a.total / a.count);
  }, [reviews]);

  const [contentFilter, setContentFilter] = useState<string>("todos");

  const filtered =
    contentFilter === "todos" ? reviews : reviews.filter((r) => r.contentId === contentFilter);
  const withReview = filtered.filter((r) => r.review?.trim());

  return (
    <div>
      {contents.length > 1 && (
        <>
          <p className="mb-3 font-heading text-lg text-foreground">Por conteúdo</p>
          <div className="overflow-hidden rounded-2xl border border-border/60">
            {contents.map((content) => (
              <button
                key={content.id}
                onClick={() =>
                  setContentFilter((prev) => (prev === content.id ? "todos" : content.id))
                }
                className={`flex w-full items-center justify-between gap-4 border-b border-border/60 px-5 py-4 text-left transition-colors last:border-0 hover:bg-muted/40 ${
                  contentFilter === content.id ? "bg-rose/10" : ""
                }`}
              >
                <p className="min-w-0 flex-1 truncate text-sm text-foreground">{content.title}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <Stars value={content.total / content.count} />
                  <span className="text-sm text-foreground tabular-nums">
                    {(content.total / content.count).toFixed(1).replace(".", ",")}
                  </span>
                  <span className="text-xs text-muted-foreground">({content.count})</span>
                </div>
              </button>
            ))}
          </div>
          {contentFilter !== "todos" && (
            <button
              onClick={() => setContentFilter("todos")}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              × limpar filtro
            </button>
          )}
        </>
      )}

      <p className="mt-8 mb-3 font-heading text-lg text-foreground">
        {withReview.length > 0 ? "Comentários" : "Avaliações"}
      </p>
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhuma avaliação pra esse conteúdo.
        </p>
      ) : (
        <div className="space-y-3">
          {(withReview.length > 0 ? withReview : filtered).map((row) => (
            <div key={row.id} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5">
              <Avatar size="lg" className="shrink-0">
                <AvatarFallback className={`text-sm font-medium ${avatarStyle(row.studentId)}`}>
                  {getInitials(row.studentName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-heading text-base text-foreground">{row.studentName}</span>
                  <Stars value={row.rating} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {row.review?.trim() && (
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-foreground">
                    {row.review}
                  </p>
                )}
                <p className="mt-2 text-[11px] font-medium tracking-wide text-gold uppercase">
                  {row.contentTitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
