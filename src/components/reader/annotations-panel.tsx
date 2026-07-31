"use client";

import { Highlighter, MessageSquare, Trash2 } from "lucide-react";
import type { Annotation } from "@/lib/annotation-utils";

export function AnnotationsPanel({
  annotations,
  onJumpTo,
  onDelete,
}: {
  annotations: Annotation[];
  onJumpTo: (annotation: Annotation) => void;
  onDelete: (id: string) => void;
}) {
  if (annotations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-5 text-center text-sm text-muted-foreground">
        Selecione um trecho do texto pra grifar ou anotar. Suas marcações
        aparecem aqui.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {annotations.map((annotation) => (
        <div
          key={annotation.id}
          className="group rounded-xl border border-border/60 bg-card p-4"
        >
          <button
            onClick={() => onJumpTo(annotation)}
            className="block w-full text-left"
          >
            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              {annotation.note ? (
                <MessageSquare className="size-3.5 text-gold" />
              ) : (
                <Highlighter className="size-3.5 text-rose" />
              )}
              {annotation.note ? "Anotação" : "Trecho grifado"}
            </div>
            <p className="line-clamp-2 text-sm text-foreground italic">
              &quot;{annotation.text}&quot;
            </p>
            {annotation.note && (
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {annotation.note}
              </p>
            )}
          </button>
          <button
            onClick={() => onDelete(annotation.id)}
            // Visible by default: on a touch screen there's no hover, so
            // hiding it behind one left no way at all to delete a marking.
            // Desktop keeps the reveal-on-hover, plus on keyboard focus.
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground transition-opacity hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <Trash2 className="size-3.5" />
            Remover
          </button>
        </div>
      ))}
    </div>
  );
}
