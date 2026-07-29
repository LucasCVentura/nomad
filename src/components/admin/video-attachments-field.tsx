"use client";

import { Trash2, Video } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { VideoAttachment } from "@/lib/content-media";

export function VideoAttachmentsField({
  videos,
  onChange,
}: {
  videos: VideoAttachment[];
  onChange: (videos: VideoAttachment[]) => void;
}) {
  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const additions: VideoAttachment[] = Array.from(files).map((file) => ({
      kind: "new",
      file,
    }));
    onChange([...videos, ...additions]);
  }

  function remove(index: number) {
    onChange(videos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-1.5">
      <Label>Vídeos</Label>
      <p className="text-xs text-muted-foreground">
        Aparecem no fim do conteúdo, depois do texto e das imagens.
      </p>

      {videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((video, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
            >
              <Video className="size-4 shrink-0 text-gold" />
              <span className="flex-1 truncate text-sm text-foreground">
                {video.kind === "existing"
                  ? decodeURIComponent(video.url.split("/").pop() ?? video.url)
                  : video.file.name}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        type="file"
        accept="video/*"
        multiple
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-foreground"
      />
    </div>
  );
}
