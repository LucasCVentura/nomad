import type { ContentBlock } from "@/lib/supabase/types";

export type Annotation = {
  id: string;
  paragraphId: string;
  start: number;
  end: number;
  text: string;
  note?: string;
};

/**
 * The source text behind every annotatable id, keyed the same way the reader
 * keys them. Used both to render and to re-anchor stored annotations.
 */
export function buildParagraphTextMap(blocks: ContentBlock[]): Map<string, string> {
  const map = new Map<string, string>();
  let paragraphIndex = 0;
  blocks.forEach((block, blockIndex) => {
    if (block.type === "page") {
      block.textBlocks.forEach((tb) => map.set(`pg${blockIndex}-${tb.id}`, tb.text));
    } else if (block.type === "paragraph") {
      map.set(`p-${paragraphIndex++}`, block.text);
    }
  });
  return map;
}

/**
 * Annotations are stored as character offsets into a paragraph, so anything
 * that reshapes the content — the doctor reconverting the PDF, or editing the
 * text — slides them out of place, and they'd redraw over the wrong words
 * without any sign of it.
 *
 * Each annotation also carries the excerpt it was made on, which is what makes
 * recovery possible: if the offsets no longer land on that excerpt, look the
 * excerpt up again — first where it used to be, then anywhere in the content.
 * Returns null when it genuinely isn't there anymore (the passage was
 * rewritten or removed), in which case the caller should leave it out rather
 * than draw it somewhere wrong.
 */
export function reanchorAnnotation(
  annotation: Annotation,
  paragraphText: Map<string, string>
): Annotation | null {
  const excerpt = annotation.text.trim();
  if (!excerpt) return null;

  const current = paragraphText.get(annotation.paragraphId);
  if (current && current.slice(annotation.start, annotation.end).trim() === excerpt) {
    return annotation;
  }

  // Same paragraph first: a reconvert of the same PDF usually only nudges the
  // offsets, so this is both the common case and the least ambiguous one.
  if (current) {
    const at = current.indexOf(excerpt);
    if (at !== -1) return { ...annotation, start: at, end: at + excerpt.length };
  }

  for (const [paragraphId, text] of paragraphText) {
    const at = text.indexOf(excerpt);
    if (at !== -1) {
      return { ...annotation, paragraphId, start: at, end: at + excerpt.length };
    }
  }

  return null;
}

export function getTextOffset(root: Node, node: Node, offset: number) {
  const preRange = document.createRange();
  preRange.selectNodeContents(root);
  preRange.setEnd(node, offset);
  return preRange.toString().length;
}

export function rangesOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number }
) {
  return a.start < b.end && b.start < a.end;
}

export type ParagraphSegment = {
  text: string;
  start: number;
  end: number;
  annotation?: Annotation;
};

export function getParagraphSegments(
  text: string,
  annotations: Annotation[]
): ParagraphSegment[] {
  if (annotations.length === 0) {
    return [{ text, start: 0, end: text.length, annotation: undefined }];
  }

  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  const segments: ParagraphSegment[] = [];
  let cursor = 0;

  for (const annotation of sorted) {
    if (annotation.start > cursor) {
      segments.push({
        text: text.slice(cursor, annotation.start),
        start: cursor,
        end: annotation.start,
      });
    }
    segments.push({
      text: text.slice(annotation.start, annotation.end),
      start: annotation.start,
      end: annotation.end,
      annotation,
    });
    cursor = annotation.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), start: cursor, end: text.length });
  }
  return segments;
}

/**
 * Splits text into sentence-sized chunks (each chunk keeps its trailing
 * punctuation/whitespace so re-joining every chunk reproduces the original
 * string exactly). Used as mobile tap targets — a whole sentence is a much
 * easier touch target than a native drag-to-select range, and taps never
 * invoke the OS's own selection UI the way a real text selection would.
 */
export function tokenizeSentences(text: string, offset = 0) {
  const matches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [text];
  const sentences: { text: string; start: number; end: number }[] = [];
  let cursor = offset;
  for (const sentence of matches) {
    const start = cursor;
    const end = start + sentence.length;
    sentences.push({ text: sentence, start, end });
    cursor = end;
  }
  return sentences;
}
