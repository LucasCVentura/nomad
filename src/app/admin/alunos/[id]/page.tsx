import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StudentAccessList, type StudentAccessItem } from "@/components/admin/student-access-list";

export default async function AdminStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: student }, { data: contents }, { data: purchases }, { data: conversations }] =
    await Promise.all([
      supabase.from("profiles").select("id, name, email, created_at").eq("id", id).maybeSingle(),
      supabase
        .from("contents")
        .select("id, title, category, price")
        .eq("status", "published")
        .order("title"),
      supabase.from("purchases").select("content_id, progress").eq("user_id", id),
      supabase.from("conversations").select("id, content_id").eq("user_id", id),
    ]);

  if (!student) {
    notFound();
  }

  const purchaseByContent = new Map((purchases ?? []).map((p) => [p.content_id, p]));
  const conversationByContent = new Map((conversations ?? []).map((c) => [c.content_id, c.id]));

  const items: StudentAccessItem[] = (contents ?? []).map((content) => {
    const purchase = purchaseByContent.get(content.id);
    return {
      contentId: content.id,
      title: content.title,
      category: content.category,
      price: content.price,
      purchased: Boolean(purchase),
      progress: purchase?.progress ?? null,
      conversationId: conversationByContent.get(content.id) ?? null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/admin/alunos"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Alunas
      </Link>

      <h1 className="font-heading text-2xl text-foreground">{student.name ?? "Aluna"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{student.email}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Cadastrada em {new Date(student.created_at).toLocaleDateString("pt-BR")}
      </p>

      <p className="mt-8 mb-3 font-heading text-lg text-foreground">Acesso a conteúdos</p>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhum conteúdo publicado ainda.
        </p>
      ) : (
        <StudentAccessList studentId={student.id} initialItems={items} />
      )}
    </div>
  );
}
