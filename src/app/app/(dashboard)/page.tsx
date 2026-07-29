import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const supabase = await createClient();
  // getSession() avoids a second Auth round-trip — middleware already
  // verified this request has a valid session before /app was reached.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/entrar?next=/app");
  }

  const [{ data: purchases }, { data: conversations }] = await Promise.all([
    supabase
      .from("purchases")
      .select("progress, completed_at, contents(id, slug, title, category)")
      .eq("user_id", session.user.id)
      .order("purchased_at", { ascending: false }),
    supabase
      .from("conversations")
      .select("id, content_id, user_last_read_at")
      .eq("user_id", session.user.id),
  ]);

  const items = purchases ?? [];

  const conversationIds = (conversations ?? []).map((c) => c.id);
  const { data: messages } = conversationIds.length
    ? await supabase
        .from("conversation_messages")
        .select("conversation_id, sender_id, created_at")
        .in("conversation_id", conversationIds)
    : { data: [] };

  const contentHasReply = new Set<string>();
  for (const conv of conversations ?? []) {
    const hasUnread = (messages ?? []).some(
      (m) =>
        m.conversation_id === conv.id &&
        m.sender_id !== session.user.id &&
        m.created_at > conv.user_last_read_at
    );
    if (hasUnread) contentHasReply.add(conv.content_id);
  }

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
          const completed = Boolean(item.completed_at);
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
              {contentHasReply.has(content.id) && (
                <span className="mt-1.5 flex w-fit items-center gap-1 rounded-full bg-rose/15 px-2 py-0.5 text-[11px] text-rose">
                  <MessageCircle className="size-3" />
                  Dra. Nathalia respondeu sua dúvida
                </span>
              )}

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span className={completed ? "flex items-center gap-1 text-rose" : ""}>
                    {completed && <CheckCircle2 className="size-3.5" />}
                    {completed ? "Concluído" : "Progresso"}
                  </span>
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
                {completed ? "Ler novamente" : "Continuar lendo"}
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          );
        })}

        <Link
          href="/app/loja"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 p-5 text-center text-muted-foreground transition-colors hover:border-rose/40 hover:text-foreground"
        >
          <span className="font-heading text-lg">+ Explorar a loja</span>
          <span className="text-sm">Descubra novos materiais de estudo</span>
        </Link>
      </div>
    </div>
  );
}
