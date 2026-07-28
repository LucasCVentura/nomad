"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PanelRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  getParagraphSegments,
  getTextOffset,
  rangesOverlap,
  type Annotation,
} from "@/lib/annotation-utils";
import {
  SelectionToolbar,
  type PendingSelection,
} from "@/components/reader/selection-toolbar";
import { AnnotationsPanel } from "@/components/reader/annotations-panel";
import type { ContentItem } from "@/lib/mock-data";

type FlatParagraph = {
  id: string;
  text: string;
  sectionHeading?: string;
};

export function ReaderView({
  content,
  body,
}: {
  content: ContentItem;
  body: { heading: string; paragraphs: string[] }[];
}) {
  const flatParagraphs: FlatParagraph[] = useMemo(() => {
    const flat: FlatParagraph[] = [];
    body.forEach((section) => {
      section.paragraphs.forEach((text, i) => {
        flat.push({
          id: `p-${flat.length}`,
          text,
          sectionHeading: i === 0 ? section.heading : undefined,
        });
      });
    });
    return flat;
  }, [body]);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const articleRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const annotationsByParagraph = useMemo(() => {
    const map = new Map<string, Annotation[]>();
    for (const annotation of annotations) {
      const list = map.get(annotation.paragraphId) ?? [];
      list.push(annotation);
      map.set(annotation.paragraphId, list);
    }
    return map;
  }, [annotations]);

  useEffect(() => {
    const seen = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(
            (entry.target as HTMLElement).dataset.paragraphIndex
          );
          seen.add(index);
        }
        const furthest = Math.max(0, ...Array.from(seen)) + 1;
        setProgress(
          Math.round((furthest / flatParagraphs.length) * 100)
        );
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 }
    );

    const nodes = articleRef.current?.querySelectorAll("[data-paragraph-index]");
    nodes?.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [flatParagraphs.length]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !toolbarRef.current?.contains(target) &&
        !articleRef.current?.contains(target)
      ) {
        setPending(null);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function handleMouseUp() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }
    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    let node: Node | null = range.commonAncestorContainer;
    let paragraphEl: HTMLElement | null = null;
    while (node) {
      if (node instanceof HTMLElement && node.dataset.paragraphId) {
        paragraphEl = node;
        break;
      }
      node = node.parentNode;
    }
    if (!paragraphEl) return;

    const start = getTextOffset(paragraphEl, range.startContainer, range.startOffset);
    const end = getTextOffset(paragraphEl, range.endContainer, range.endOffset);
    if (end <= start) return;

    const rect = range.getBoundingClientRect();
    setPending({
      paragraphId: paragraphEl.dataset.paragraphId!,
      start,
      end,
      text,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }

  function commitAnnotation(note?: string) {
    if (!pending) return;
    setAnnotations((prev) => {
      const filtered = prev.filter(
        (a) => !(a.paragraphId === pending.paragraphId && rangesOverlap(a, pending))
      );
      return [
        ...filtered,
        {
          id: crypto.randomUUID(),
          paragraphId: pending.paragraphId,
          start: pending.start,
          end: pending.end,
          text: pending.text,
          note,
        },
      ];
    });
    window.getSelection()?.removeAllRanges();
    setPending(null);
  }

  function cancelSelection() {
    window.getSelection()?.removeAllRanges();
    setPending(null);
  }

  function jumpTo(annotation: Annotation) {
    const el = document.querySelector(
      `[data-paragraph-id="${annotation.paragraphId}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setActiveId(annotation.id);
    window.setTimeout(() => setActiveId(null), 1500);
  }

  function deleteAnnotation(id: string) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  const panel = (
    <AnnotationsPanel
      annotations={annotations}
      onJumpTo={jumpTo}
      onDelete={deleteAnnotation}
    />
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/app"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <p className="truncate font-heading text-base text-foreground sm:text-lg">
            {content.title}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <Progress value={progress} className="w-28" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="sm" />}>
              <PanelRight className="size-4" />
              Anotações
              {annotations.length > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-rose text-[10px] text-rose-foreground">
                  {annotations.length}
                </span>
              )}
            </SheetTrigger>
            <SheetContent side="right" className="w-5/6 sm:w-96">
              <SheetHeader>
                <SheetTitle>Minhas anotações</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto px-4 pb-4">{panel}</div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <article
          ref={articleRef}
          onMouseUp={handleMouseUp}
          className="select-text rounded-3xl border border-border/60 bg-card/40 p-8 text-[17px] leading-[1.85] text-[oklch(0.88_0.015_75)] sm:p-12"
        >
          <span className="text-[11px] font-medium tracking-wide text-gold uppercase">
            {content.category}
          </span>
          <h1 className="mt-1.5 font-heading text-3xl text-foreground">
            {content.title}
          </h1>
          <p className="mt-6 text-sm text-muted-foreground">
            Selecione qualquer trecho abaixo pra grifar ou adicionar uma
            anotação.
          </p>

          <div className="mt-8 space-y-7">
            {flatParagraphs.map((paragraph, index) => {
              const anns = annotationsByParagraph.get(paragraph.id) ?? [];
              const segments = getParagraphSegments(paragraph.text, anns);
              return (
                <div key={paragraph.id}>
                  {paragraph.sectionHeading && (
                    <h2 className="mb-4 font-heading text-xl text-foreground">
                      {paragraph.sectionHeading}
                    </h2>
                  )}
                  <p
                    data-paragraph-id={paragraph.id}
                    data-paragraph-index={index}
                  >
                    {segments.map((segment, i) =>
                      segment.annotation ? (
                        <mark
                          key={i}
                          className={`rounded-sm px-0.5 text-foreground transition-shadow ${
                            segment.annotation.note ? "bg-gold/30" : "bg-rose/30"
                          } ${
                            activeId === segment.annotation.id
                              ? "ring-2 ring-rose"
                              : ""
                          }`}
                        >
                          {segment.text}
                        </mark>
                      ) : (
                        <span key={i}>{segment.text}</span>
                      )
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      {pending && (
        <SelectionToolbar
          selection={pending}
          toolbarRef={toolbarRef}
          onHighlight={() => commitAnnotation(undefined)}
          onNote={(note) => commitAnnotation(note)}
          onCancel={cancelSelection}
        />
      )}
    </div>
  );
}
