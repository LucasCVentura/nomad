import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { ContentBlock } from "@/lib/supabase/types";

export type VideoAttachment =
  | { kind: "existing"; url: string; caption?: string }
  | { kind: "new"; file: File; caption?: string };

export const PAGES_BUCKET = "content-pages";
export const VIDEOS_BUCKET = "content-videos";

// How long a rendered page image stays fetchable. Long enough to read a
// course in one sitting; any reload re-signs from scratch.
export const PAGE_URL_TTL_SECONDS = 60 * 60 * 8;

/**
 * Moves freshly converted page/image blocks out of the JSON body and into
 * storage, leaving behind the object's path.
 *
 * The conversion produces each page as a `data:` URL, and writing those
 * straight into `contents.body` puts the entire course — megabytes of base64
 * — inside a single Postgres row, which then has to travel in full on every
 * read. The "novo conteúdo" flow always uploaded them; the reconvert flow
 * didn't, so reconverting an existing course silently inlined it again.
 * Both call this now.
 *
 * The bucket is private: `url` holds a path, not a link, and the reader signs
 * it per request (see `signPageUrls`). Slugs are public, so a public bucket
 * would make every page guessable by URL.
 */
export async function uploadContentImages(
  supabase: SupabaseClient<Database>,
  slug: string,
  blocks: ContentBlock[]
): Promise<ContentBlock[]> {
  const out: ContentBlock[] = [];
  let index = 0;

  for (const block of blocks) {
    if (block.type !== "image" && block.type !== "page") {
      out.push(block);
      continue;
    }
    // Already stored (a path, or a legacy absolute URL) — nothing to move.
    if (!block.url.startsWith("data:")) {
      out.push(block);
      continue;
    }

    const blob = await (await fetch(block.url)).blob();
    const ext = block.type === "page" ? "jpg" : "png";
    const path = `${slug}/${block.type}-${index++}.${ext}`;
    const { error } = await supabase.storage.from(PAGES_BUCKET).upload(path, blob, {
      contentType: block.type === "page" ? "image/jpeg" : "image/png",
      upsert: true,
    });
    if (error) throw error;
    out.push({ ...block, url: path });
  }

  return out;
}

/**
 * Turns the stored paths back into fetchable links, right before render.
 * Blocks that already carry an absolute or inline URL (anything converted
 * before the move to storage) are passed through untouched.
 *
 * Páginas e vídeos vivem em buckets separados, então cada grupo é assinado no
 * seu — assinar tudo no bucket errado devolveria link que não abre.
 */
export async function signContentUrls(
  supabase: SupabaseClient<Database>,
  blocks: ContentBlock[]
): Promise<ContentBlock[]> {
  // Um caminho guardado nunca tem esquema; `data:` e `http` são conteúdo
  // antigo, de antes da mudança para storage, e passam direto.
  const isStoredPath = (url: string) =>
    !url.startsWith("data:") && !url.startsWith("http");

  const pagePaths = blocks
    .filter((b) => (b.type === "image" || b.type === "page") && isStoredPath(b.url))
    .map((b) => (b as Extract<ContentBlock, { type: "image" | "page" }>).url);

  const videoPaths = blocks
    .filter((b) => b.type === "video" && isStoredPath(b.url))
    .map((b) => (b as Extract<ContentBlock, { type: "video" }>).url);

  if (pagePaths.length === 0 && videoPaths.length === 0) return blocks;

  const [pages, videos] = await Promise.all([
    pagePaths.length
      ? supabase.storage.from(PAGES_BUCKET).createSignedUrls(pagePaths, PAGE_URL_TTL_SECONDS)
      : Promise.resolve({ data: [] }),
    videoPaths.length
      ? supabase.storage.from(VIDEOS_BUCKET).createSignedUrls(videoPaths, PAGE_URL_TTL_SECONDS)
      : Promise.resolve({ data: [] }),
  ]);

  const signed = new Map(
    [...(pages.data ?? []), ...(videos.data ?? [])].map((r) => [r.path, r.signedUrl])
  );

  return blocks.map((block) =>
    (block.type === "image" || block.type === "page" || block.type === "video") &&
    signed.has(block.url)
      ? { ...block, url: signed.get(block.url)! }
      : block
  );
}

export async function uploadCoverImage(
  supabase: SupabaseClient<Database>,
  slug: string,
  file: File | null
): Promise<string | null> {
  if (!file) return null;
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${slug}/cover-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("content-images")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from("content-images").getPublicUrl(path).data.publicUrl;
}

/**
 * Sobe os vídeos e guarda o CAMINHO, não um link.
 *
 * O bucket é privado: vídeo anexado a um curso é o produto pago, e um link
 * público seria adivinhável a partir do slug, que é público. Quem transforma
 * o caminho em link é `signContentUrls`, na hora de renderizar, e só depois de
 * a RLS confirmar a compra.
 *
 * `slug` (e não o id) é a pasta, igual em `uploadContentImages` — é o que a
 * policy do bucket procura.
 */
export async function uploadVideoAttachments(
  supabase: SupabaseClient<Database>,
  slug: string,
  videos: VideoAttachment[]
): Promise<ContentBlock[]> {
  const blocks: ContentBlock[] = [];
  let index = 0;
  for (const video of videos) {
    if (video.kind === "existing") {
      blocks.push({ type: "video", url: video.url, caption: video.caption });
      continue;
    }
    const ext = video.file.name.split(".").pop() || "mp4";
    const path = `${slug}/video-${index++}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .upload(path, video.file, { upsert: true });
    if (error) throw error;
    blocks.push({ type: "video", url: path, caption: video.caption });
  }
  return blocks;
}
