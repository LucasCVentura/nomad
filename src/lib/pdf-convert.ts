import type { ContentBlock, PageTextBlock } from "@/lib/supabase/types";

type PdfjsLib = typeof import("pdfjs-dist");

// pdfjs-dist 6.x calls these very-new TC39 Map methods internally on the
// main thread too (not just inside the worker, which gets the same
// polyfill prepended to public/pdfjs/pdf.worker.min.mjs). Safari doesn't
// implement them yet as of many current iOS versions — without this,
// conversion fails on iPhone/iPad while working fine on Chrome.
function polyfillMapUpsert() {
  const proto = Map.prototype as unknown as Record<string, unknown>;
  if (typeof proto.getOrInsertComputed !== "function") {
    Object.defineProperty(proto, "getOrInsertComputed", {
      value: function (this: Map<unknown, unknown>, key: unknown, callback: (key: unknown) => unknown) {
        if (this.has(key)) return this.get(key);
        const value = callback(key);
        this.set(key, value);
        return value;
      },
      writable: true,
      configurable: true,
    });
  }
  if (typeof proto.getOrInsert !== "function") {
    Object.defineProperty(proto, "getOrInsert", {
      value: function (this: Map<unknown, unknown>, key: unknown, defaultValue: unknown) {
        if (this.has(key)) return this.get(key);
        this.set(key, defaultValue);
        return defaultValue;
      },
      writable: true,
      configurable: true,
    });
  }
}

// Yields to the browser's event loop. Mobile Safari can flag a script as
// unresponsive and kill it if the main thread never comes up for air —
// image-heavy PDFs are exactly the case that can run long.
function yieldToMain() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

const RENDER_SCALE = 1.5;

type MeasuredItem = { text: string; x: number; y: number; width: number; height: number };
type MeasuredLine = {
  text: string;
  top: number;
  bottom: number;
  xMin: number;
  xMax: number;
  height: number;
};
type MeasuredGroupLine = { text: string; x: number; y: number; width: number; height: number };

// Runs the page's real text content through pdf.js's own TextLayer — the
// exact code every PDF.js-based viewer uses to build its selectable overlay
// — into an offscreen container, then reads back each run's actual
// browser-laid-out box. This replaces guessing width/height from character
// counts: the measured box already accounts for font substitution, kerning,
// everything, because it's the same measurement a real viewer would show.
async function measureTextItems(
  page: any,
  viewport: any,
  pdfjsLib: PdfjsLib
): Promise<MeasuredItem[]> {
  const textContent = await page.getTextContent();

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-99999px";
  container.style.top = "0";
  container.style.lineHeight = "1";
  document.body.appendChild(container);

  try {
    const textLayer = new pdfjsLib.TextLayer({ textContentSource: textContent, container, viewport });
    await textLayer.render();

    // pdf.js's own stylesheet (which we deliberately don't load here) is
    // what normally turns the container's `round()`-based size and each
    // span's `--font-height` custom property into real box/font sizes — we
    // apply the equivalent ourselves so getBoundingClientRect() below
    // reports the exact glyph boxes a real viewer would lay out.
    container.style.width = `${viewport.width}px`;
    container.style.height = `${viewport.height}px`;

    const containerRect = container.getBoundingClientRect();
    const strs = textLayer.textContentItemsStr;
    const items: MeasuredItem[] = [];
    textLayer.textDivs.forEach((div: HTMLElement, i: number) => {
      const text = strs[i];
      if (!text || !text.trim()) return;
      const fontHeight = parseFloat(div.style.getPropertyValue("--font-height")) || 0;
      div.style.position = "absolute";
      div.style.whiteSpace = "pre";
      div.style.fontSize = `${fontHeight * viewport.scale}px`;
      const r = div.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      items.push({
        text,
        x: r.left - containerRect.left,
        y: r.top - containerRect.top,
        width: r.width,
        height: r.height,
      });
    });
    return items;
  } finally {
    container.remove();
  }
}

// pdf.js emits one item per text *run* (often just a few words, split
// wherever the PDF's content stream has a kerning adjustment) — bucket runs
// that land on the same visual line back into one line, in reading order.
function bucketItemsIntoLines(items: MeasuredItem[]): MeasuredLine[] {
  const rows = new Map<number, MeasuredItem[]>();
  for (const item of items) {
    const bucket = Math.round(item.y / 3) * 3;
    const list = rows.get(bucket) ?? [];
    list.push(item);
    rows.set(bucket, list);
  }

  const lines: MeasuredLine[] = [];
  for (const entries of rows.values()) {
    entries.sort((a, b) => a.x - b.x);
    const text = entries
      .map((e) => e.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    const top = Math.min(...entries.map((e) => e.y));
    const bottom = Math.max(...entries.map((e) => e.y + e.height));
    const xMin = Math.min(...entries.map((e) => e.x));
    const xMax = Math.max(...entries.map((e) => e.x + e.width));
    lines.push({ text, top, bottom, xMin, xMax, height: bottom - top });
  }

  lines.sort((a, b) => a.top - b.top);
  return lines;
}

// Groups nearby lines (similar height, small vertical gap) into one
// selectable "paragraph" — so a drag-select or highlight can span several
// original PDF lines — while every line keeps its own exact, individually
// measured box instead of being reflowed into one guessed bounding box.
function groupLinesIntoParagraphs(lines: MeasuredLine[]): MeasuredGroupLine[][] {
  if (lines.length === 0) return [];

  type Group = { lines: MeasuredLine[] };
  const groups: Group[] = [{ lines: [lines[0]] }];

  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1];
    const line = lines[i];
    const gap = line.top - prev.bottom;
    const avgHeight = (prev.height + line.height) / 2;
    const sameGroup = gap < avgHeight * 0.9 && Math.abs(line.height - prev.height) < avgHeight * 0.35;

    if (sameGroup) {
      groups[groups.length - 1].lines.push(line);
    } else {
      groups.push({ lines: [line] });
    }
  }

  return groups.map(({ lines: groupLines }) =>
    groupLines.map((line, i) => ({
      // A trailing space (except after the last line) keeps a word that
      // wrapped mid-sentence from reading as one run-on word — and since
      // it's rendered as part of the line's own text in the reader, offsets
      // used for stored highlights/annotations stay in sync automatically.
      text: i < groupLines.length - 1 ? `${line.text} ` : line.text,
      x: line.xMin,
      y: line.top,
      width: line.xMax - line.xMin,
      height: line.height,
    }))
  );
}

const ICLOUD_HINT =
  "confira se o arquivo está baixado no aparelho (e não só salvo no iCloud/nuvem) e se há conexão com a internet";

export async function convertPdfToBlocks(
  file: File,
  onProgress?: (page: number, totalPages: number) => void
): Promise<ContentBlock[]> {
  if (file.size === 0) {
    throw new Error(`arquivo vazio — ${ICLOUD_HINT}`);
  }

  polyfillMapUpsert();

  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();

  if (buffer.byteLength === 0) {
    throw new Error(`não consegui ler o conteúdo do arquivo — ${ICLOUD_HINT}`);
  }
  const header = new TextDecoder().decode(new Uint8Array(buffer, 0, Math.min(5, buffer.byteLength)));
  if (header !== "%PDF-") {
    throw new Error(`o arquivo não parece ser um PDF válido ou está incompleto — ${ICLOUD_HINT}`);
  }

  const doc = await pdfjsLib.getDocument({
    data: buffer,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  }).promise;

  const blocks: ContentBlock[] = [];
  const diagnostics: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    try {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: RENDER_SCALE });

      let paragraphs: MeasuredGroupLine[][] = [];
      try {
        const items = await measureTextItems(page, viewport, pdfjsLib);
        const lines = bucketItemsIntoLines(items);
        paragraphs = groupLinesIntoParagraphs(lines);
      } catch (err) {
        console.error(`[pdf-convert] p${pageNum} texto:`, err);
        diagnostics.push(`p${pageNum} texto: ${errMessage(err)}`);
      }

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        diagnostics.push(`p${pageNum}: canvas 2d context indisponível`);
        continue;
      }

      try {
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch (err) {
        diagnostics.push(`p${pageNum} render: ${errMessage(err)}`);
        canvas.width = 0;
        canvas.height = 0;
        continue;
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      canvas.width = 0;
      canvas.height = 0;

      const textBlocks: PageTextBlock[] = paragraphs.map((groupLines, i) => ({
        id: `b${i}`,
        text: groupLines.map((l) => l.text).join(""),
        lines: groupLines.map((l) => ({
          text: l.text,
          xPct: (l.x / viewport.width) * 100,
          yPct: (l.y / viewport.height) * 100,
          widthPct: (l.width / viewport.width) * 100,
          heightPct: (l.height / viewport.height) * 100,
          fontSizePct: (l.height / viewport.width) * 100,
        })),
      }));

      blocks.push({
        type: "page",
        url: dataUrl,
        aspectRatio: viewport.width / viewport.height,
        textBlocks,
      });
    } catch (err) {
      diagnostics.push(`p${pageNum}: ${errMessage(err)}`);
    }

    onProgress?.(pageNum, doc.numPages);
    await yieldToMain();
  }

  if (blocks.length === 0) {
    const detail = diagnostics.length > 0 ? diagnostics.slice(0, 3).join(" | ") : "sem detalhes";
    throw new Error(`nada extraído de ${doc.numPages} página(s) — ${detail}`);
  }

  return blocks;
}
