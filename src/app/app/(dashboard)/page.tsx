import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?next=/app");
  }

  const { data: purchases } = await supabase
    .from("purchases")
    .select("progress, contents(slug, title, category)")
    .eq("user_id", user.id)
    .order("purchased_at", { ascending: false });

  const items = purchases ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <p className="text-sm text-muted-foreground">
        Bem-vinda de volta. Você tem {items.length} conteúdos na sua área de
        estudos.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const content = item.contents;
          if (!content) return null;
          return (
            <div
              key={content.slug}
              className="flex flex-col rounded-2xl border border-border/60 bg-card p-5"
            >
              <div className="mb-4 flex aspect-4/3 items-center justify-center rounded-lg bg-linear-to-br from-gold/15 to-rose/15">
                <FileText className="size-8 text-gold" />
              </div>
              <span className="text-[11px] font-medium tracking-wide text-gold uppercase">
                {content.category}
              </span>
              <h3 className="mt-1.5 font-heading text-lg leading-snug text-foreground">
                {content.title}
              </h3>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.progress === 100 ? "Concluído" : "Progresso"}</span>
                  <span>{item.progress}%</span>
                </div>
                <Progress value={item.progress ?? 0} />
              </div>

              <Button
                size="sm"
                variant="outline"
                className="mt-5"
                render={<Link href={`/app/ler/${content.slug}`} />}
                nativeButton={false}
              >
                {item.progress === 100 ? "Ler novamente" : "Continuar lendo"}
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          );
        })}

        <Link
          href="/loja"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 p-5 text-center text-muted-foreground transition-colors hover:border-rose/40 hover:text-foreground"
        >
          <span className="font-heading text-lg">+ Explorar a loja</span>
          <span className="text-sm">Descubra novos materiais de estudo</span>
        </Link>
      </div>
    </div>
  );
}
