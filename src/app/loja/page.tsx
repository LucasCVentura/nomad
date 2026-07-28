"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, ShoppingCart } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { catalog, categories } from "@/lib/mock-data";

export default function LojaPage() {
  const [active, setActive] = useState<(typeof categories)[number]>("Todos");

  const filtered =
    active === "Todos"
      ? catalog
      : catalog.filter((item) => item.category === active);

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
            Materiais escritos por profissionais da estética, prontos pra
            comprar e estudar direto na plataforma.
          </p>

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
                <div className="mb-4 flex aspect-4/3 items-center justify-center rounded-lg bg-linear-to-br from-gold/15 to-rose/15">
                  <FileText className="size-8 text-gold" />
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
                  {item.format} · {item.pages} páginas
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
                    >
                      <ShoppingCart className="size-3.5" />
                      Comprar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
