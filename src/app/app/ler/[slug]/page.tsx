import { notFound, redirect } from "next/navigation";
import { ReaderView } from "@/components/reader/reader-view";
import { createClient } from "@/lib/supabase/server";
import type { ContentBlock } from "@/lib/supabase/types";

export default async function LerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Independent lookups run in parallel instead of one-after-another.
  const [
    {
      data: { session },
    },
    { data: row },
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from("contents").select("id, title, category, body").eq("slug", slug).maybeSingle(),
  ]);

  if (!session) {
    redirect(`/entrar?next=/app/ler/${slug}`);
  }

  if (!row) {
    notFound();
  }

  const [{ data: purchase }, { data: profile }] = await Promise.all([
    supabase
      .from("purchases")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("content_id", row.id)
      .maybeSingle(),
    supabase.from("profiles").select("is_admin").eq("id", session.user.id).single(),
  ]);

  // The admin can always open any content to see it exactly as a student
  // would — otherwise she'd never be able to preview what she just
  // published, since she hasn't "purchased" her own material.
  if (!purchase && !profile?.is_admin) {
    redirect("/loja");
  }

  // Reached via the admin-only bypass (no real purchase) → she almost
  // certainly got here from the admin content list, so "back" should
  // return her there instead of to the student dashboard.
  const backHref = !purchase && profile?.is_admin ? "/admin/conteudos" : "/app";

  return (
    <ReaderView
      content={{ title: row.title, category: row.category }}
      blocks={row.body as ContentBlock[]}
      contentId={row.id}
      backHref={backHref}
    />
  );
}
