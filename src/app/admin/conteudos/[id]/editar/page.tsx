import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signPageUrls } from "@/lib/content-media";
import { EditContentForm } from "@/components/admin/edit-content-form";
import type { ContentBlock } from "@/lib/supabase/types";

export default async function EditarConteudoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: content } = await supabase
    .from("contents")
    .select("id, slug, title, category, price, description, status, body, cover_image_url")
    .eq("id", id)
    .maybeSingle();

  if (!content) {
    notFound();
  }

  // The original PDF is only there for content that went through the
  // upload flow (not, say, something created by hand) — if it's missing,
  // the reconvert action just won't be offered.
  const { data: sourceFiles } = await supabase.storage
    .from("content-pdfs")
    .list(content.slug);
  const hasSourcePdf = (sourceFiles ?? []).some((f) => f.name === "original.pdf");

  // Signed links for the thumbnails only. The form keeps the stored paths, so
  // saving can't write an expiring URL back into the content.
  const blocks = content.body as ContentBlock[];
  const signed = await signPageUrls(supabase, blocks);
  const previewUrls: Record<string, string> = {};
  blocks.forEach((block, i) => {
    const after = signed[i];
    if ("url" in block && after && "url" in after && block.url !== after.url) {
      previewUrls[block.url] = after.url;
    }
  });

  return (
    <EditContentForm
      contentId={content.id}
      slug={content.slug}
      hasSourcePdf={hasSourcePdf}
      previewUrls={previewUrls}
      initial={{
        title: content.title,
        category: content.category,
        price: content.price,
        description: content.description ?? "",
        status: content.status as "draft" | "published",
        blocks: content.body as ContentBlock[],
        coverImageUrl: content.cover_image_url,
      }}
    />
  );
}
