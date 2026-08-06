"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { BlockEditor, type EditableBlock } from "@/components/admin/block-editor";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { VideoAttachmentsField } from "@/components/admin/video-attachments-field";
import { convertPdfToBlocks } from "@/lib/pdf-convert";
import {
  uploadContentImages,
  uploadCoverImage,
  uploadVideoAttachments,
  type VideoAttachment,
} from "@/lib/content-media";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { CONTENT_CATEGORIES } from "@/lib/categories";

type Step = "form" | "processing" | "review" | "publishing";

export default function NovoConteudoPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [progress, setProgress] = useState({ page: 0, total: 0 });

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CONTENT_CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [videos, setVideos] = useState<VideoAttachment[]>([]);

  async function handleProcess(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Selecione um arquivo PDF.");
      return;
    }
    setError(null);
    setWarning(null);
    setStep("processing");
    try {
      const { blocks: result, warning: convertWarning } = await convertPdfToBlocks(
        file,
        (page, total) => setProgress({ page, total })
      );
      setBlocks(result as EditableBlock[]);
      setWarning(convertWarning ?? null);
      setStep("review");
    } catch (err) {
      console.error(err);
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Não consegui processar esse PDF (${detail}). Tente outro arquivo.`);
      setStep("form");
    }
  }

  async function handlePublish(status: "draft" | "published" | "coming_soon") {
    setStep("publishing");
    setError(null);
    try {
      const supabase = createClient();
      const slug = `${slugify(title)}-${Date.now().toString(36)}`;

      if (file) {
        await supabase.storage
          .from("content-pdfs")
          .upload(`${slug}/original.pdf`, file, { upsert: true });
      }

      const finalBlocks = await uploadContentImages(supabase, slug, blocks);

      const videoBlocks = await uploadVideoAttachments(supabase, slug, videos);
      const coverImageUrl = await uploadCoverImage(supabase, slug, coverFile);

      const pageCount = finalBlocks.filter(
        (b) => b.type === "page" || b.type === "paragraph"
      ).length;

      const { error: insertError } = await supabase.from("contents").insert({
        slug,
        title,
        category,
        price: Number(price.replace(",", ".")) || 0,
        description,
        status,
        body: [...finalBlocks, ...videoBlocks],
        pages: pageCount,
        cover_image_url: coverImageUrl,
      });
      if (insertError) throw insertError;

      router.push("/admin/conteudos");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Não consegui publicar. Confira os dados e tente de novo.");
      setStep("review");
    }
  }

  if (step === "review") {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <button
          onClick={() => setStep("form")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar e trocar o PDF
        </button>

        <p className="mb-1 font-heading text-2xl text-foreground">Revisão</p>
        <p className="mb-6 text-sm text-muted-foreground">
          A extração é automática — confira se a divisão entre títulos,
          parágrafos e imagens ficou correta antes de publicar.
        </p>

        {warning && (
          <p className="mb-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
            {warning}
          </p>
        )}

        <BlockEditor blocks={blocks} onChange={setBlocks} />

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            className="bg-rose text-rose-foreground hover:bg-rose/90"
            disabled={step !== "review"}
            onClick={() => handlePublish("published")}
          >
            Publicar
          </Button>
          <Button
            variant="outline"
            className="border-gold/40 text-gold hover:bg-gold/10"
            onClick={() => handlePublish("coming_soon")}
          >
            Marcar como &quot;Em breve&quot;
          </Button>
          <Button variant="outline" onClick={() => handlePublish("draft")}>
            Salvar como rascunho
          </Button>
        </div>
      </div>
    );
  }

  if (step === "publishing") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 py-20 text-center">
        <Loader2 className="size-8 animate-spin text-rose" />
        <p className="text-sm text-muted-foreground">Publicando conteúdo...</p>
      </div>
    );
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

      <p className="mb-6 font-heading text-2xl text-foreground">Novo conteúdo</p>

      {step === "processing" ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 p-16 text-center">
          <FileUp className="size-8 text-gold" />
          <p className="text-sm text-muted-foreground">
            Processando página {progress.page} de {progress.total}...
          </p>
          <Progress
            value={progress.total ? (progress.page / progress.total) * 100 : 0}
            className="w-48"
          />
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleProcess}>
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Harmonização Facial na Prática"
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
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
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="79,90"
                required
              />
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

          <div className="space-y-1.5">
            <Label htmlFor="pdf">Arquivo PDF</Label>
            <input
              id="pdf"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-foreground"
              required
            />
          </div>

          <CoverImageField file={coverFile} onFileChange={setCoverFile} />

          <VideoAttachmentsField videos={videos} onChange={setVideos} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="bg-rose text-rose-foreground hover:bg-rose/90">
            Processar PDF
          </Button>
        </form>
      )}
    </div>
  );
}
