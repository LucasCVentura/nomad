"use client";

import { ArrowDown, ArrowUp, Heading, Pilcrow, Trash2 } from "lucide-react";
import type { ContentBlock } from "@/lib/supabase/types";

// Video blocks are managed in their own section (VideoAttachmentsField),
// always appended after saving — they never pass through here.
export type EditableBlock = Exclude<ContentBlock, { type: "video" }>;

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: EditableBlock[];
  onChange: (blocks: EditableBlock[]) => void;
}) {
  function updateBlock(index: number, block: EditableBlock) {
    const next = [...blocks];
    next[index] = block;
    onChange(next);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function deleteBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <div
          key={index}
          className="flex gap-3 rounded-xl border border-border/60 bg-card p-4"
        >
          <div className="flex flex-1 flex-col gap-2">
            {block.type !== "image" && block.type !== "page" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateBlock(index, {
                      ...block,
                      type: block.type === "heading" ? "paragraph" : "heading",
                    })
                  }
                  className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {block.type === "heading" ? (
                    <Heading className="size-3" />
                  ) : (
                    <Pilcrow className="size-3" />
                  )}
                  {block.type === "heading" ? "Título" : "Parágrafo"}
                </button>
              </div>
            )}

            {block.type === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.url}
                alt={block.alt ?? "Imagem do conteúdo"}
                className="h-40 w-auto max-w-xs rounded-lg border border-border/60 object-contain"
              />
            )}

            {block.type === "page" && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.url}
                  alt="Página do conteúdo"
                  className="h-40 w-auto rounded-lg border border-border/60 object-contain"
                />
                <p className="text-xs text-muted-foreground">
                  Página extraída como imagem — {block.textBlocks.length} trecho(s)
                  de texto selecionável detectado(s).
                </p>
              </div>
            )}

            {block.type !== "image" && block.type !== "page" && (
              <textarea
                value={block.text}
                onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
                rows={block.type === "heading" ? 1 : 3}
                className={`w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring ${
                  block.type === "heading" ? "font-heading text-base" : ""
                }`}
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => moveBlock(index, -1)}
              disabled={index === 0}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ArrowUp className="size-3.5" />
            </button>
            <button
              onClick={() => moveBlock(index, 1)}
              disabled={index === blocks.length - 1}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ArrowDown className="size-3.5" />
            </button>
            <button
              onClick={() => deleteBlock(index)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
