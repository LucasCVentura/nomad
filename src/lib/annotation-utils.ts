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

export function getParagraphSegments(text: string, annotations: Annotation[]) {
  if (annotations.length === 0) return [{ text, annotation: undefined }];

  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  const segments: { text: string; annotation?: Annotation }[] = [];
  let cursor = 0;

  for (const annotation of sorted) {
    if (annotation.start > cursor) {
      segments.push({ text: text.slice(cursor, annotation.start) });
    }
    segments.push({
      text: text.slice(annotation.start, annotation.end),
      annotation,
    });
    cursor = annotation.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }
  return segments;
}
