import { redirect } from "next/navigation";
import { LojaGrid, type LojaItem } from "@/components/loja-grid";
import { createClient } from "@/lib/supabase/server";

export default async function AppLojaPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/entrar?next=/app/loja");
  }

  const [{ data: contents }, { data: purchases }] = await Promise.all([
    supabase
      .from("contents")
      .select("id, slug, title, category, format, pages, price, description, cover_image_url")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase.from("purchases").select("content_id").eq("user_id", session.user.id),
  ]);

  const purchasedIds = new Set((purchases ?? []).map((p) => p.content_id));

  const items: LojaItem[] = (contents ?? []).map((item) => ({
    ...item,
    coverImageUrl: item.cover_image_url,
    purchased: purchasedIds.has(item.id),
  }));

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-2 flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
        <span className="text-rose">✦</span>
        Loja
      </div>
      <h1 className="font-heading text-3xl text-foreground">Todos os conteúdos</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Materiais escritos pela Dra. Nathalia, prontos pra comprar e estudar direto na plataforma.
      </p>

      <LojaGrid items={items} isLoggedIn />
    </div>
  );
}
