"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockEditor, type EditableBlock } from "@/components/admin/block-editor";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { VideoAttachmentsField } from "@/components/admin/video-attachments-field";
import {
  uploadCoverImage,
  uploadVideoAttachments,
  type VideoAttachment,
} from "@/lib/content-media";
import { createClient } from "@/lib/supabase/client";
import { CONTENT_CATEGORIES } from "@/lib/categories";
import type { ContentBlock } from "@/lib/supabase/types";

export function EditContentForm({
  contentId,
  initial,
}: {
  contentId: string;
  initial: {
    title: string;
    category: string;
    price: number;
    description: string;
    status: "draft" | "published";
    blocks: ContentBlock[];
    coverImageUrl: string | null;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [price, setPrice] = useState(String(initial.price).replace(".", ","));
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState<"draft" | "published">(initial.status);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Video blocks live at the tail of `body` but are edited in their own
  // section, not the text/image BlockEditor — split them out once on mount.
  const initialSplit = useMemo(() => {
    const textBlocks: EditableBlock[] = [];
    const videoAttachments: VideoAttachment[] = [];
    for (const block of initial.blocks) {
      if (block.type === "video") {
        videoAttachments.push({ kind: "existing", url: block.url, caption: block.caption });
      } else {
        textBlocks.push(block);
      }
    }
    return { textBlocks, videoAttachments };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [blocks, setBlocks] = useState<EditableBlock[]>(initialSplit.textBlocks);
  const [videos, setVideos] = useState<VideoAttachment[]>(initialSplit.videoAttachments);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const videoBlocks = await uploadVideoAttachments(supabase, contentId, videos);
      const coverImageUrl = coverFile
        ? await uploadCoverImage(supabase, contentId, coverFile)
        : initial.coverImageUrl;

      const { error: updateError } = await supabase
        .from("contents")
        .update({
          title,
          category,
          price: Number(price.replace(",", ".")) || 0,
          description,
          status,
          body: [...blocks, ...videoBlocks],
          cover_image_url: coverImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentId);
      if (updateError) throw updateError;

      router.push("/admin/conteudos");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Não consegui salvar as alterações. Tente de novo.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/admin/conteudos"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      <p className="mb-1 font-heading text-2xl text-foreground">Editar conteúdo</p>
      <p className="mb-6 text-sm text-muted-foreground">
        Alunas que já compraram esse conteúdo vão ver um aviso de que ele foi
        atualizado.
      </p>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
            >
              {CONTENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
            >
              <option value="published">Publicado</option>
              <option value="draft">Rascunho</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição curta</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring"
            required
          />
        </div>

        <CoverImageField
          file={coverFile}
          onFileChange={setCoverFile}
          existingUrl={initial.coverImageUrl}
        />

        <VideoAttachmentsField videos={videos} onChange={setVideos} />

        <div>
          <p className="mb-3 font-heading text-lg text-foreground">Conteúdo</p>
          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="bg-rose text-rose-foreground hover:bg-rose/90"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
