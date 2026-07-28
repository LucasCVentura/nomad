import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LojaGrid, type LojaItem } from "@/components/loja-grid";
import { createClient } from "@/lib/supabase/server";

export default async function LojaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: contents }, { data: purchases }] = await Promise.all([
    supabase
      .from("contents")
      .select("id, slug, title, category, format, pages, price, description")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    user
      ? supabase.from("purchases").select("content_id").eq("user_id", user.id)
      : Promise.resolve({ data: null }),
  ]);

  const purchasedIds = new Set((purchases ?? []).map((p) => p.content_id));

  const items: LojaItem[] = (contents ?? []).map((item) => ({
    ...item,
    purchased: purchasedIds.has(item.id),
  }));

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col px-6 py-16">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-3 flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
            <span className="text-rose">✦</span>
            Loja
            <span className="h-px w-10 bg-gold/40" />
          </div>
          <h1 className="font-heading text-4xl text-foreground sm:text-5xl">
            Todos os conteúdos
          </h1>
          <p className="mt-3 max-w-lg text-muted-foreground">
            Materiais escritos pela Dra. Nathalia, prontos pra comprar e
            estudar direto na plataforma.
          </p>

          <LojaGrid items={items} isLoggedIn={Boolean(user)} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
