"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageCircle, PanelRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  getParagraphSegments,
  getTextOffset,
  rangesOverlap,
  tokenizeSentences,
  type Annotation,
} from "@/lib/annotation-utils";
import {
  SelectionToolbar,
  type PendingSelection,
} from "@/components/reader/selection-toolbar";
import { AnnotationsPanel } from "@/components/reader/annotations-panel";
import { SidePanel } from "@/components/reader/side-panel";
import { ChatThread, type ChatMessage } from "@/components/chat/chat-thread";
import { createClient } from "@/lib/supabase/client";
import { useConversationUnread } from "@/lib/use-conversation-unread";
import type { ContentBlock } from "@/lib/supabase/types";

export function ReaderView({
  content,
  blocks,
  contentId,
  backHref = "/app",
  chat,
  initialCompleted = false,
}: {
  content: { title: string; category: string };
  blocks: ContentBlock[];
  contentId?: string;
  backHref?: string;
  chat?: {
    conversationId: string | null;
    currentUserId: string;
    initialMessages: ChatMessage[];
    unreadCount: number;
  };
  initialCompleted?: boolean;
}) {
  // Owned here (not just passed straight through) so it survives the chat
  // panel unmounting on close — otherwise the first message a student ever
  // sends creates a conversation the panel then "forgets" the moment it's
  // reopened, and a second send tries to create a duplicate conversation
  // row and fails outright on the unique constraint.
  const [conversationId, setConversationId] = useState(chat?.conversationId ?? null);
  const chatUnread = useConversationUnread(
    conversationId,
    chat?.currentUserId ?? "",
    chat?.unreadCount ?? 0
  );
  // Only paragraph blocks are annotatable; each gets a stable sequential id.
  const paragraphMeta = useMemo(() => {
    const byBlockIndex = new Map<number, { id: string; index: number; text: string }>();
    let count = 0;
    blocks.forEach((block, blockIndex) => {
      if (block.type === "paragraph") {
        byBlockIndex.set(blockIndex, { id: `p-${count}`, index: count, text: block.text });
        count++;
      }
    });
    return { byBlockIndex, total: count };
  }, [blocks]);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [mobileAnchor, setMobileAnchor] = useState<{
    paragraphId: string;
    start: number;
    end: number;
  } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(initialCompleted);
  const [annotationsOpen, setAnnotationsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const articleRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const annotationsByParagraph = useMemo(() => {
    const map = new Map<string, Annotation[]>();
    for (const annotation of annotations) {
      const list = map.get(annotation.paragraphId) ?? [];
      list.push(annotation);
      map.set(annotation.paragraphId, list);
    }
    return map;
  }, [annotations]);

  // Percentage of the content actually scrolled, measured against its own
  // scroll container (not the window) — the reader area scrolls internally
  // so annotations/chat can sit beside it instead of covering it.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function updateProgress() {
      if (!el) return;
      const scrollable = el.scrollHeight - el.clientHeight;
      const pct =
        scrollable <= 0
          ? 100
          : Math.min(100, Math.max(0, Math.round((el.scrollTop / scrollable) * 100)));
      setProgress(pct);
    }
    updateProgress();
    el.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      el.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [blocks]);

  // Persist reading progress so it survives across sessions and shows up
  // on the student dashboard. Debounced to avoid writing on every scroll tick.
  useEffect(() => {
    if (!contentId || progress === 0) return;
    const timeout = window.setTimeout(async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      await supabase
        .from("purchases")
        .update({ progress })
        .eq("user_id", session.user.id)
        .eq("content_id", contentId);
    }, 1500);
    return () => window.clearTimeout(timeout);
  }, [progress, contentId]);

  async function markCompleted() {
    if (!contentId || completed) return;
    setCompleted(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await supabase
      .from("purchases")
      .update({ completed_at: new Date().toISOString() })
      .eq("user_id", session.user.id)
      .eq("content_id", contentId);
  }

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !toolbarRef.current?.contains(target) &&
        !articleRef.current?.contains(target)
      ) {
        setPending(null);
        setMobileAnchor(null);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Desktop only: native drag-to-select. Touch-based selection never fires a
  // `mouseup` on iOS/Android, and the OS's own selection UI (handles + the
  // Copy/Look Up callout) would collide with ours anyway — mobile uses the
  // tap-a-sentence flow below instead, with native selection disabled there.
  useEffect(() => {
    let timeoutId: number;

    function trySetPendingFromSelection() {
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
      if (!paragraphEl || !articleRef.current?.contains(paragraphEl)) return;

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

    function onSelectionChange() {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(trySetPendingFromSelection, 250);
    }

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      window.clearTimeout(timeoutId);
    };
  }, []);

  // Mobile: tapping a sentence selects it; tapping another sentence in the
  // same paragraph extends the range to cover both. No native selection is
  // ever created, so there's nothing for the browser's own UI to fight over.
  function handleSentenceTap(paragraphId: string, paragraphText: string, start: number, end: number) {
    setMobileAnchor((prevAnchor) => {
      if (!prevAnchor || prevAnchor.paragraphId !== paragraphId) {
        setPending({
          paragraphId,
          start,
          end,
          text: paragraphText.slice(start, end).trim(),
          x: 0,
          y: 0,
        });
        return { paragraphId, start, end };
      }
      const newStart = Math.min(prevAnchor.start, start);
      const newEnd = Math.max(prevAnchor.end, end);
      setPending({
        paragraphId,
        start: newStart,
        end: newEnd,
        text: paragraphText.slice(newStart, newEnd).trim(),
        x: 0,
        y: 0,
      });
      return prevAnchor;
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
    setMobileAnchor(null);
  }

  function cancelSelection() {
    window.getSelection()?.removeAllRanges();
    setPending(null);
    setMobileAnchor(null);
  }

  function jumpTo(annotation: Annotation) {
    const candidates = document.querySelectorAll(
      `[data-paragraph-id="${annotation.paragraphId}"]`
    );
    const visible = Array.from(candidates).find(
      (el) => (el as HTMLElement).offsetParent !== null
    );
    (visible ?? candidates[0])?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setActiveId(annotation.id);
    window.setTimeout(() => setActiveId(null), 1500);
  }

  function deleteAnnotation(id: string) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <p className="truncate font-heading text-base text-foreground sm:text-lg">
            {content.title}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <Progress value={progress} className="w-28" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          {completed ? (
            <span className="flex items-center gap-1.5 text-xs text-rose">
              <CheckCircle2 className="size-4" />
              <span className="hidden sm:inline">Concluído</span>
            </span>
          ) : (
            progress === 100 && (
              <Button
                size="sm"
                className="bg-rose text-rose-foreground hover:bg-rose/90"
                onClick={markCompleted}
              >
                <CheckCircle2 className="size-4" />
                <span className="hidden sm:inline">Marcar como concluído</span>
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="sm"
            className={annotationsOpen ? "border-rose text-rose" : ""}
            onClick={() => setAnnotationsOpen((v) => !v)}
          >
            <PanelRight className="size-4" />
            <span className="hidden sm:inline">Anotações</span>
            {annotations.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-rose text-[10px] text-rose-foreground">
                {annotations.length}
              </span>
            )}
          </Button>
          {chat && contentId && (
            <Button
              variant="outline"
              size="sm"
              className={chatOpen ? "border-rose text-rose" : ""}
              onClick={() => setChatOpen((v) => !v)}
            >
              <MessageCircle className="size-4" />
              <span className="hidden sm:inline">Falar com a Dra. Nathalia</span>
              {chatUnread > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-rose text-[10px] text-rose-foreground">
                  {chatUnread}
                </span>
              )}
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-6 py-12">
            <article
              ref={articleRef}
              className="rounded-3xl border border-border/60 bg-card/40 p-8 text-[17px] leading-[1.85] text-[oklch(0.88_0.015_75)] sm:p-12"
            >
              <span className="text-[11px] font-medium tracking-wide text-gold uppercase">
                {content.category}
              </span>
              <h1 className="mt-1.5 font-heading text-3xl text-foreground">
                {content.title}
              </h1>
              <p className="mt-6 text-sm text-muted-foreground">
                <span className="hidden sm:inline">
                  Selecione qualquer trecho abaixo pra grifar ou adicionar uma
                  anotação.
                </span>
                <span className="sm:hidden">
                  Toque numa frase pra selecionar — toque em outra pra estender
                  o trecho.
                </span>
              </p>

              <div className="mt-8 space-y-7">
                {blocks.map((block, blockIndex) => {
                  if (block.type === "heading") {
                    return (
                      <h2 key={blockIndex} className="font-heading text-xl text-foreground">
                        {block.text}
                      </h2>
                    );
                  }

                  if (block.type === "image") {
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={blockIndex}
                        src={block.url}
                        alt={block.alt ?? ""}
                        className="w-full rounded-xl border border-border/60"
                      />
                    );
                  }

                  if (block.type === "video") {
                    return (
                      <div key={blockIndex} className="space-y-2">
                        <video
                          src={block.url}
                          controls
                          className="w-full rounded-xl border border-border/60"
                        />
                        {block.caption && (
                          <p className="text-sm text-muted-foreground">{block.caption}</p>
                        )}
                      </div>
                    );
                  }

                  const meta = paragraphMeta.byBlockIndex.get(blockIndex)!;
                  const anns = annotationsByParagraph.get(meta.id) ?? [];
                  const segments = getParagraphSegments(block.text, anns);

                  const pendingHere =
                    pending && pending.paragraphId === meta.id ? pending : null;
                  const mobileSegments = getParagraphSegments(
                    block.text,
                    pendingHere
                      ? [
                          ...anns,
                          {
                            id: "__pending__",
                            paragraphId: meta.id,
                            start: pendingHere.start,
                            end: pendingHere.end,
                            text: pendingHere.text,
                          },
                        ]
                      : anns
                  );

                  return (
                    <div key={blockIndex}>
                      {/* Desktop: native drag-to-select */}
                      <p
                        data-paragraph-id={meta.id}
                        data-paragraph-index={meta.index}
                        className="hidden select-text sm:block"
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

                      {/* Mobile: tap-a-sentence, no native selection involved */}
                      <p
                        data-paragraph-id={meta.id}
                        data-paragraph-index={meta.index}
                        className="select-none sm:hidden"
                      >
                        {mobileSegments.map((segment, i) => {
                          if (segment.annotation) {
                            const isPending = segment.annotation.id === "__pending__";
                            return (
                              <mark
                                key={i}
                                className={`rounded-sm px-0.5 text-foreground ${
                                  isPending
                                    ? "bg-rose/20 outline-dashed outline-1 outline-rose/60"
                                    : segment.annotation.note
                                      ? "bg-gold/30"
                                      : "bg-rose/30"
                                } ${
                                  activeId === segment.annotation.id
                                    ? "ring-2 ring-rose"
                                    : ""
                                }`}
                              >
                                {segment.text}
                              </mark>
                            );
                          }
                          const sentences = tokenizeSentences(segment.text, segment.start);
                          return (
                            <span key={i}>
                              {sentences.map((sentence, j) => (
                                <span
                                  key={j}
                                  onClick={() =>
                                    handleSentenceTap(meta.id, block.text, sentence.start, sentence.end)
                                  }
                                  className="active:bg-muted"
                                >
                                  {sentence.text}
                                </span>
                              ))}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </div>

        {annotationsOpen && (
          <SidePanel title="Minhas anotações" onClose={() => setAnnotationsOpen(false)}>
            <AnnotationsPanel
              annotations={annotations}
              onJumpTo={jumpTo}
              onDelete={deleteAnnotation}
            />
          </SidePanel>
        )}

        {chatOpen && chat && contentId && (
          <SidePanel title="Dra. Nathalia" onClose={() => setChatOpen(false)}>
            <ChatThread
              conversationId={conversationId}
              contentId={contentId}
              currentUserId={chat.currentUserId}
              otherPartyName="Dra. Nathalia"
              initialMessages={chat.initialMessages}
              emptyStateLabel="Envie sua primeira mensagem para a Dra. Nathalia sobre este curso."
              onConversationCreated={setConversationId}
            />
          </SidePanel>
        )}
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
