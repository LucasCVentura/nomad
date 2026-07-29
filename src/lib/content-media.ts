import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { ContentBlock } from "@/lib/supabase/types";

export type VideoAttachment =
  | { kind: "existing"; url: string; caption?: string }
  | { kind: "new"; file: File; caption?: string };

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
