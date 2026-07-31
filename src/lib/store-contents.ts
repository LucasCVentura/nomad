import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type StoreContent = {
  id: string;
  slug: string;
  title: string;
  category: string;
  format: string;
  pages: number | null;
  price: number;
  description: string | null;
  coverImageUrl: string | null;
};

/**
 * A vitrine — tudo que as telas de venda precisam, sem o `body`, que é o
 * produto e só sai para quem comprou.
 *
 * Uma view no Postgres não carrega `NOT NULL`, então os tipos gerados marcam
 * toda coluna como anulável mesmo quando a tabela por baixo garante o
 * contrário. A conversão fica aqui, num lugar só e explicada, em vez de virar
 * `!` espalhado pelas três telas que leem a vitrine.
 */
export async function listStoreContents(
  supabase: SupabaseClient<Database>,
  options?: { limit?: number }
): Promise<StoreContent[]> {
  let query = supabase
    .from("store_contents")
    .select("id, slug, title, category, format, pages, price, description, cover_image_url")
    .order("created_at", { ascending: false });

  if (options?.limit) query = query.limit(options.limit);

  const { data } = await query;

  return (data ?? [])
    // Descarta qualquer linha incompleta em vez de confiar cegamente: o custo
    // é um filtro, e evita um card quebrado na loja se algo der errado.
    .filter((row) => row.id && row.slug && row.title && row.price !== null)
    .map((row) => ({
      id: row.id!,
      slug: row.slug!,
      title: row.title!,
      category: row.category ?? "",
      format: row.format ?? "PDF",
      pages: row.pages,
      price: Number(row.price),
      description: row.description,
      coverImageUrl: row.cover_image_url,
    }));
}
