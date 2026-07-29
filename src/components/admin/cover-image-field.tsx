"use client";

import { useEffect, useMemo } from "react";
import { ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

export function CoverImageField({
  file,
  onFileChange,
  existingUrl,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  existingUrl?: string | null;
}) {
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]);

  const previewUrl = objectUrl ?? existingUrl ?? null;

  return (
    <div className="space-y-1.5">
      <Label>Capa do curso</Label>
      <p className="text-xs text-muted-foreground">
        Recomendado: 800 × 600px (proporção 4:3), JPG ou PNG.
      </p>
      <div className="flex items-center gap-4">
        <div className="flex aspect-4/3 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Capa do curso" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="block flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-foreground"
        />
      </div>
    </div>
  );
}
