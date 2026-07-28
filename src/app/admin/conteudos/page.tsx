import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminConteudosPage() {
  const supabase = await createClient();
  const { data: contents } = await supabase
    .from("contents")
    .select("id, slug, title, category, price, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {contents?.length ?? 0} conteúdo(s) no total.
        </p>
        <Button
          className="bg-rose text-rose-foreground hover:bg-rose/90"
          render={<Link href="/admin/conteudos/novo" />}
          nativeButton={false}
        >
          <Plus className="size-4" />
          Novo conteúdo
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
        {!contents || contents.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum conteúdo publicado ainda. Clique em &quot;Novo
            conteúdo&quot; pra subir o primeiro PDF.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-card/60 text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Título</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Preço</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {contents.map((item) => (
                <tr key={item.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3 text-foreground">{item.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">{item.category}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    R$ {item.price.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        item.status === "published"
                          ? "bg-rose/15 text-rose"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.status === "published" ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      render={<Link href={`/app/ler/${item.slug}`} />}
                      nativeButton={false}
                    >
                      <Eye className="size-3.5" />
                      Visualizar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
