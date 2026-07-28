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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/entrar?next=/app/ler/${slug}`);
  }

  const { data: row } = await supabase
    .from("contents")
    .select("id, title, category, body")
    .eq("slug", slug)
    .maybeSingle();

  if (!row) {
    notFound();
  }

  const { data: purchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_id", row.id)
    .maybeSingle();

  if (!purchase) {
    redirect("/loja");
  }

  return (
    <ReaderView
      content={{ title: row.title, category: row.category }}
      blocks={row.body as ContentBlock[]}
      contentId={row.id}
    />
  );
}
