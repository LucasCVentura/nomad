"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, FileText, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ConteudoRow = {
  id: string;
  slug: string;
  title: string;
  price: number;
  status: "draft" | "published" | "coming_soon";
  coverImageUrl: string | null;
  format: string;
  pages: number | null;
  salesCount: number;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type StatusFilter = "todos" | "published" | "coming_soon" | "draft";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "coming_soon", label: "Em breve" },
  { value: "draft", label: "Rascunhos" },
];

const STATUS_BADGE: Record<ConteudoRow["status"], { label: string; className: string }> = {
  published: { label: "Publicado", className: "bg-rose/85 text-rose-foreground" },
  coming_soon: { label: "Em breve", className: "bg-gold/85 text-background" },
  draft: { label: "Rascunho", className: "bg-background/85 text-muted-foreground" },
};

export function ConteudosGrid({ rows }: { rows: ConteudoRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("todos");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "todos" && r.status !== status) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, status]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título ou categoria..."
            className="h-10 w-full rounded-xl border border-border/60 bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
          />
        </div>
        <div className="flex gap-1.5 rounded-xl border border-border/60 bg-card p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                status === tab.value
                  ? "bg-rose/15 text-rose"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          {rows.length === 0
            ? 'Nenhum conteúdo publicado ainda. Clique em "Novo conteúdo" pra subir o primeiro PDF.'
            : "Nenhum conteúdo encontrado pra esse filtro."}
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:border-rose/40"
            >
              <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden bg-linear-to-br from-gold/15 to-rose/15">
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
                <span
                  className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs backdrop-blur ${STATUS_BADGE[item.status].className}`}
                >
                  {STATUS_BADGE[item.status].label}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-2 font-heading text-base leading-snug text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.format} · {item.pages ?? "—"} páginas
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="font-heading text-lg text-foreground">
                    {formatCurrency(item.price)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShoppingBag className="size-3.5" />
                    {item.salesCount} venda{item.salesCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    render={<Link href={`/admin/conteudos/${item.id}/editar`} />}
                    nativeButton={false}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    render={<Link href={`/app/ler/${item.slug}`} />}
                    nativeButton={false}
                  >
                    <Eye className="size-3.5" />
                    Visualizar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
