import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LojaGrid, type LojaItem } from "@/components/loja-grid";
import { createClient } from "@/lib/supabase/server";

// This is the public showcase — anyone can browse it, logged in or not.
// But if someone signed in lands here (an old link, the marketing nav...),
// send her to the real store at /app/loja instead: this page uses the
// logged-out marketing header, which has no session-aware chrome at all
// (no avatar, "Entrar"/"Criar conta" always shown) and reads as "you got
// logged out" even though the session is still fine.
export default async function LojaPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/app/loja");
  }

  const { data: contents } = await supabase
    .from("contents")
    .select("id, slug, title, category, format, pages, price, description")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const items: LojaItem[] = (contents ?? []).map((item) => ({
    ...item,
    purchased: false,
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

          <LojaGrid items={items} isLoggedIn={false} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
