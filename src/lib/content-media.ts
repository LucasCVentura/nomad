import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { ContentBlock } from "@/lib/supabase/types";

export type VideoAttachment =
  | { kind: "existing"; url: string; caption?: string }
  | { kind: "new"; file: File; caption?: string };

export const PAGES_BUCKET = "content-pages";

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
 */
export async function signPageUrls(
  supabase: SupabaseClient<Database>,
  blocks: ContentBlock[]
): Promise<ContentBlock[]> {
  const paths = blocks
    .filter(
      (b): b is Extract<ContentBlock, { type: "image" | "page" }> =>
        (b.type === "image" || b.type === "page") &&
        !b.url.startsWith("data:") &&
        !b.url.startsWith("http")
    )
    .map((b) => b.url);

  if (paths.length === 0) return blocks;

  const { data } = await supabase.storage
    .from(PAGES_BUCKET)
    .createSignedUrls(paths, PAGE_URL_TTL_SECONDS);

  const signed = new Map((data ?? []).map((r) => [r.path, r.signedUrl]));

  return blocks.map((block) =>
    (block.type === "image" || block.type === "page") && signed.has(block.url)
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
      .from("content-videos")
      .upload(path, video.file, { upsert: true });
    if (error) throw error;
    const url = supabase.storage.from("content-videos").getPublicUrl(path).data.publicUrl;
    blocks.push({ type: "video", url, caption: video.caption });
  }
  return blocks;
}
