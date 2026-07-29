"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export type LojaItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  format: string;
  pages: number | null;
  price: number;
  description: string | null;
  purchased: boolean;
  coverImageUrl: string | null;
};

export function LojaGrid({
  items,
  isLoggedIn,
}: {
  items: LojaItem[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState("Todos");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(items.map((i) => i.category)))],
    [items]
  );

  const filtered =
    active === "Todos" ? items : items.filter((item) => item.category === active);

  async function handleBuy(item: LojaItem) {
    if (!isLoggedIn) {
      router.push("/registro?next=/app/loja");
      return;
    }
    setPendingId(item.id);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      router.push("/entrar?next=/app/loja");
      return;
    }
    const { error } = await supabase
      .from("purchases")
      .insert({ user_id: user.id, content_id: item.id });
    setPendingId(null);
    if (!error) {
      router.push(`/app/ler/${item.slug}`);
      router.refresh();
    }
  }

  if (items.length === 0) {
    return (
      <p className="mt-10 rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
        Nenhum conteúdo publicado ainda. Volte em breve.
      </p>
    );
  }

  return (
    <>
      <div className="mt-10 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActive(category)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              active === category
                ? "border-rose bg-rose/15 text-rose"
                : "border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div
            key={item.slug}
            className="flex flex-col rounded-2xl border border-border/60 bg-card p-5"
          >
            <div className="mb-4 flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-gold/15 to-rose/15">
              {item.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.coverImageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FileText className="size-8 text-gold" />
              )}
            </div>
            <span className="text-[11px] font-medium tracking-wide text-gold uppercase">
              {item.category}
            </span>
            <h3 className="mt-1.5 font-heading text-lg leading-snug text-foreground">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {item.format} · {item.pages ?? "—"} páginas
            </p>
            <div className="mt-5 flex items-center justify-between">
              <span className="font-heading text-xl text-foreground">
                R$ {item.price.toFixed(2).replace(".", ",")}
              </span>
              {item.purchased ? (
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/app/ler/${item.slug}`} />}
                  nativeButton={false}
                >
                  Já adquirido
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-rose text-rose-foreground hover:bg-rose/90"
                  disabled={pendingId === item.id}
                  onClick={() => handleBuy(item)}
                >
                  <ShoppingCart className="size-3.5" />
                  {pendingId === item.id ? "Comprando..." : "Comprar"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
