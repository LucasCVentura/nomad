"use client";

import { useState } from "react";
import { Highlighter, MessageSquarePlus, Send, X } from "lucide-react";

export type PendingSelection = {
  paragraphId: string;
  start: number;
  end: number;
  text: string;
  x: number;
  y: number;
};

export function SelectionToolbar({
  selection,
  toolbarRef,
  onHighlight,
  onNote,
  onCancel,
}: {
  selection: PendingSelection;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  onHighlight: () => void;
  onNote: (note: string) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"actions" | "note">("actions");
  const [draft, setDraft] = useState("");

  return (
    <div ref={toolbarRef}>
      {/* Desktop: floating pill anchored to the selection */}
      <div
        className="fixed z-50 hidden -translate-x-1/2 -translate-y-full rounded-xl border border-border/60 bg-popover p-1.5 shadow-2xl shadow-black/40 sm:block"
        style={{ left: selection.x, top: selection.y - 10 }}
      >
        {mode === "actions" ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onHighlight}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              <Highlighter className="size-3.5 text-rose" />
              Grifar
            </button>
            <button
              onClick={() => setMode("note")}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              <MessageSquarePlus className="size-3.5 text-gold" />
              Anotar
            </button>
            <span className="mx-0.5 h-4 w-px bg-border" />
            <button
              onClick={onCancel}
              aria-label="Cancelar seleção"
              className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex w-64 flex-col gap-2 p-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Nova anotação
              </span>
              <button
                onClick={onCancel}
                aria-label="Cancelar anotação"
                className="flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escreva sua anotação..."
              rows={2}
              className="w-full resize-none rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
            />
            <button
              disabled={!draft.trim()}
              onClick={() => onNote(draft.trim())}
              className="flex items-center justify-center gap-1.5 self-end rounded-lg bg-rose px-3 py-1.5 text-xs text-rose-foreground disabled:opacity-40"
            >
              Salvar
              <Send className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile: bottom action bar, away from the native selection bubble and handles */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-popover pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl shadow-black/40 sm:hidden">
        {mode === "actions" ? (
          <div className="flex items-center gap-2 p-3">
            <button
              onClick={onHighlight}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose/15 py-3 text-sm font-medium text-rose"
            >
              <Highlighter className="size-4" />
              Grifar
            </button>
            <button
              onClick={() => setMode("note")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold/15 py-3 text-sm font-medium text-gold"
            >
              <MessageSquarePlus className="size-4" />
              Anotar
            </button>
            <button
              onClick={onCancel}
              aria-label="Cancelar seleção"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Nova anotação
              </span>
              <button
                onClick={onCancel}
                aria-label="Cancelar anotação"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escreva sua anotação..."
              rows={2}
              className="w-full resize-none rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
            />
            <button
              disabled={!draft.trim()}
              onClick={() => onNote(draft.trim())}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-rose py-3 text-sm font-medium text-rose-foreground disabled:opacity-40"
            >
              Salvar anotação
              <Send className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
