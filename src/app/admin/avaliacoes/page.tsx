import { Star, MessageSquareText, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AvaliacoesList, type ReviewRow } from "@/components/admin/avaliacoes-list";

export default async function AdminAvaliacoesPage() {
  const supabase = await createClient();

  // RLS já limita isto à admin ("Users see own purchases, admin sees all").
  const { data: rows } = await supabase
    .from("purchases")
    .select(
      "id, rating, review, purchased_at, completed_at, user_id, profiles(name), contents(id, title)"
    )
    .not("rating", "is", null)
    .order("completed_at", { ascending: false });

  const reviews: ReviewRow[] = (rows ?? [])
    .filter((r) => r.contents)
    .map((r) => ({
      id: r.id,
      rating: r.rating ?? 0,
      review: r.review,
      studentId: r.user_id,
      studentName: r.profiles?.name ?? "Aluna",
      contentId: r.contents!.id,
      contentTitle: r.contents!.title,
      date: r.completed_at ?? r.purchased_at,
    }));

  if (reviews.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <p className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhuma aluna avaliou um conteúdo ainda. A avaliação é pedida assim
          que ela marca um curso como concluído.
        </p>
      </div>
    );
  }

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const withComment = reviews.filter((r) => r.review?.trim()).length;

  const stats = [
    { label: "Nota média", value: average.toFixed(1).replace(".", ","), icon: Star },
    { label: "Avaliações", value: String(reviews.length), icon: ListChecks },
    { label: "Com comentário", value: String(withComment), icon: MessageSquareText },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-rose/15 text-rose">
              <stat.icon className="size-4" />
            </div>
            <p className="font-heading text-2xl text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <AvaliacoesList reviews={reviews} />
      </div>
    </div>
  );
}
