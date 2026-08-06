import Link from "next/link";
import { FileStack, CheckCircle2, PenLine, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ConteudosGrid, type ConteudoRow } from "@/components/admin/conteudos-grid";

export default async function AdminConteudosPage() {
  const supabase = await createClient();
  const [{ data: contents }, { data: purchases }] = await Promise.all([
    supabase
      .from("contents")
      .select("id, slug, title, category, price, status, cover_image_url, format, pages, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("purchases").select("content_id"),
  ]);

  const salesByContent = new Map<string, number>();
  for (const p of purchases ?? []) {
    salesByContent.set(p.content_id, (salesByContent.get(p.content_id) ?? 0) + 1);
  }

  const rows: ConteudoRow[] = (contents ?? []).map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    category: item.category,
    price: item.price,
    status: item.status as "draft" | "published" | "coming_soon",
    coverImageUrl: item.cover_image_url,
    format: item.format,
    pages: item.pages,
    salesCount: salesByContent.get(item.id) ?? 0,
  }));

  const published = rows.filter((r) => r.status === "published").length;
  const comingSoon = rows.filter((r) => r.status === "coming_soon").length;
  const drafts = rows.filter((r) => r.status === "draft").length;

  const stats = [
    { label: "Conteúdos no total", value: String(rows.length), icon: FileStack },
    { label: "Publicados", value: String(published), icon: CheckCircle2 },
    { label: "Em breve", value: String(comingSoon), icon: Clock },
    { label: "Rascunhos", value: String(drafts), icon: PenLine },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-6 flex justify-end">
        <Button
          className="bg-rose text-rose-foreground hover:bg-rose/90"
          render={<Link href="/admin/conteudos/novo" />}
          nativeButton={false}
        >
          <Plus className="size-4" />
          Novo conteúdo
        </Button>
      </div>

      <div className="mt-4">
        <ConteudosGrid rows={rows} />
      </div>
    </div>
  );
}
