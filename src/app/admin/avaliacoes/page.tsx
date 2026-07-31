import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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

export default async function AdminAvaliacoesPage() {
  const supabase = await createClient();

  // RLS já limita isto à admin ("Users see own purchases, admin sees all").
  const { data: rows } = await supabase
    .from("purchases")
    .select("rating, review, purchased_at, completed_at, profiles(name), contents(id, title)")
    .not("rating", "is", null)
    .order("completed_at", { ascending: false });

  const rated = rows ?? [];
  const average =
    rated.length > 0
      ? rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length
      : 0;

  // Uma linha por conteúdo, para responder "o que está agradando mais".
  const byContent = new Map<
    string,
    { title: string; total: number; count: number; withReview: number }
  >();
  for (const row of rated) {
    const content = row.contents;
    if (!content) continue;
    const entry = byContent.get(content.id) ?? {
      title: content.title,
      total: 0,
      count: 0,
      withReview: 0,
    };
    entry.total += row.rating ?? 0;
    entry.count += 1;
    if (row.review?.trim()) entry.withReview += 1;
    byContent.set(content.id, entry);
  }
  const contents = [...byContent.values()].sort(
    (a, b) => b.total / b.count - a.total / a.count
  );

  const comments = rated.filter((r) => r.review?.trim());

  if (rated.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <p className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhuma aluna avaliou um conteúdo ainda. A avaliação é pedida assim
          que ela marca um curso como concluído.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-border/60 bg-card p-5">
        <div>
          <p className="font-heading text-3xl text-foreground">
            {average.toFixed(1).replace(".", ",")}
          </p>
          <Stars value={average} />
        </div>
        <div className="text-sm text-muted-foreground">
          {rated.length} avaliaç{rated.length === 1 ? "ão" : "ões"}
          {comments.length > 0 && (
            <>
              {" · "}
              {comments.length} com comentário
            </>
          )}
        </div>
      </div>

      {contents.length > 1 && (
        <>
          <p className="mt-8 mb-3 font-heading text-lg text-foreground">
            Por conteúdo
          </p>
          <div className="overflow-hidden rounded-2xl border border-border/60">
            {contents.map((content) => (
              <div
                key={content.title}
                className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4 last:border-0"
              >
                <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {content.title}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <Stars value={content.total / content.count} />
                  <span className="text-sm text-foreground tabular-nums">
                    {(content.total / content.count).toFixed(1).replace(".", ",")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({content.count})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-8 mb-3 font-heading text-lg text-foreground">
        {comments.length > 0 ? "Comentários" : "Avaliações"}
      </p>
      <div className="space-y-3">
        {(comments.length > 0 ? comments : rated).map((row, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars value={row.rating ?? 0} />
              <span className="text-sm text-foreground">
                {row.profiles?.name ?? "Aluna"}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(row.completed_at ?? row.purchased_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
            {row.review?.trim() && (
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground">
                {row.review}
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {row.contents?.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
