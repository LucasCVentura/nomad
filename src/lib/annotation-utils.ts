export type Annotation = {
  id: string;
  paragraphId: string;
  start: number;
  end: number;
  text: string;
  note?: string;
};

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
