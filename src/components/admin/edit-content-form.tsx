"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { BlockEditor, type EditableBlock } from "@/components/admin/block-editor";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { VideoAttachmentsField } from "@/components/admin/video-attachments-field";
import {
  uploadContentImages,
  uploadCoverImage,
  uploadVideoAttachments,
  type VideoAttachment,
} from "@/lib/content-media";
import { convertPdfToBlocks } from "@/lib/pdf-convert";
import { createClient } from "@/lib/supabase/client";
import type { ContentBlock } from "@/lib/supabase/types";

export function EditContentForm({
  contentId,
  slug,
  hasSourcePdf,
  previewUrls,
  initial,
}: {
  contentId: string;
  slug: string;
  hasSourcePdf: boolean;
  // Signed links for the stored page paths, display-only (see BlockEditor).
  previewUrls?: Record<string, string>;
  initial: {
    title: string;
    category: string;
    price: number;
    description: string;
    status: "draft" | "published" | "coming_soon";
    blocks: ContentBlock[];
    coverImageUrl: string | null;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [price, setPrice] = useState(String(initial.price).replace(".", ","));
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState<"draft" | "published" | "coming_soon">(initial.status);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

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
  const [reconverting, setReconverting] = useState(false);
  const [reconvertProgress, setReconvertProgress] = useState({ page: 0, total: 0 });
  const [deleting, setDeleting] = useState(false);

  async function handleReconvert() {
    if (
      !confirm(
        "Isso vai buscar o PDF original e refazer o texto/imagens do conteúdo do zero, usando o conversor mais recente. Suas edições de texto e a ordem que você ajustou manualmente serão substituídas. Vídeos e capa não são afetados.\n\nOs grifos e anotações das alunas são reposicionados automaticamente pelo trecho que elas marcaram — só se perde o que estiver num trecho que você reescrever ou remover. Continuar?"
      )
    ) {
      return;
    }
    setReconverting(true);
    setError(null);
    setWarning(null);
    try {
      const supabase = createClient();
      const { data: pdfBlob, error: downloadError } = await supabase.storage
        .from("content-pdfs")
        .download(`${slug}/original.pdf`);
      if (downloadError || !pdfBlob) throw downloadError ?? new Error("PDF original não encontrado.");

      const file = new File([pdfBlob], "original.pdf", { type: "application/pdf" });
      const { blocks: result, warning: convertWarning } = await convertPdfToBlocks(
        file,
        (page, total) => setReconvertProgress({ page, total })
      );
      setBlocks(result as EditableBlock[]);
      setWarning(convertWarning ?? null);
    } catch (err) {
      console.error(err);
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Não consegui reconverter o PDF (${detail}).`);
    } finally {
      setReconverting(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Excluir este conteúdo? Isso remove o material, as anotações e o histórico de chat das alunas que o tinham — não tem como desfazer.\n\nSe o conteúdo já teve alguma venda, a exclusão vai ser recusada (o histórico de pedidos precisa continuar intacto); nesse caso, mude o status para \"Rascunho\" em vez de excluir. Continuar?"
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.from("contents").delete().eq("id", contentId);
      if (deleteError) throw deleteError;

      router.push("/admin/conteudos");
      router.refresh();
    } catch (err) {
      console.error(err);
      // 23503 = violação de chave estrangeira — order_items.content_id é
      // "on delete restrict" de propósito, pra uma exclusão nunca apagar
      // pedido/venda já registrado.
      const isSalesLock =
        typeof err === "object" && err !== null && "code" in err && err.code === "23503";
      setError(
        isSalesLock
          ? "Não dá pra excluir: este conteúdo já tem venda registrada. Troque o status para \"Rascunho\" pra tirá-lo da loja sem perder o histórico."
          : "Não consegui excluir. Tente de novo."
      );
      setDeleting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      // Reconverting hands back pages as inline `data:` URLs. Saving those
      // as-is was writing the whole course into the row as base64 — this is
      // the step the create flow always had and this one was missing.
      const storedBlocks = await uploadContentImages(supabase, slug, blocks);
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
          body: [...storedBlocks, ...videoBlocks],
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
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
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
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published" | "coming_soon")
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
            >
              <option value="published">Publicado</option>
              <option value="coming_soon">Em breve</option>
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-heading text-lg text-foreground">Conteúdo</p>
            {hasSourcePdf && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={reconverting}
                onClick={handleReconvert}
              >
                <RefreshCw className={`size-3.5 ${reconverting ? "animate-spin" : ""}`} />
                {reconverting
                  ? `Reconvertendo página ${reconvertProgress.page}/${reconvertProgress.total}...`
                  : "Reconverter PDF original"}
              </Button>
            )}
          </div>
          {hasSourcePdf && (
            <p className="mb-3 text-xs text-muted-foreground">
              Refaz o texto e as imagens usando o PDF original e o conversor
              mais recente — útil se este conteúdo foi convertido antes de
              uma melhoria no conversor.
            </p>
          )}
          {reconverting && (
            <Progress
              value={
                reconvertProgress.total
                  ? (reconvertProgress.page / reconvertProgress.total) * 100
                  : 0
              }
              className="mb-3"
            />
          )}
          <BlockEditor blocks={blocks} onChange={setBlocks} previewUrls={previewUrls} />
        </div>

        {warning && (
          <p className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
            {warning}
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="bg-rose text-rose-foreground hover:bg-rose/90"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>

        <div className="rounded-xl border border-destructive/30 p-4">
          <p className="text-sm font-medium text-foreground">Excluir conteúdo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Remove o material permanentemente, junto com anotações e chat das
            alunas. Não é possível se já houver alguma venda registrada — use
            &quot;Rascunho&quot; pra tirar da loja sem excluir.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="mt-3"
            disabled={deleting}
            onClick={handleDelete}
          >
            <Trash2 className="size-3.5" />
            {deleting ? "Excluindo..." : "Excluir conteúdo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
