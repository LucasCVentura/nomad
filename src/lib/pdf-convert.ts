import type { ContentBlock } from "@/lib/supabase/types";

type Matrix = [number, number, number, number, number, number];

function multiplyMatrix(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4],
    a[4] * b[1] + a[5] * b[3] + b[5],
  ];
}

function transformPoint(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

type TextLine = { y: number; text: string; fontSize: number };
type TextBlock = { y: number; text: string; fontSize: number };
type ImageBlock = { y: number; dataUrl: string };

const MIN_IMAGE_SIZE = 32;

async function extractTextLines(page: any, viewport: any): Promise<TextLine[]> {
  const textContent = await page.getTextContent();
  const rows = new Map<number, { x: number; str: string; fontSize: number }[]>();

  for (const item of textContent.items) {
    if (!("str" in item) || !item.str || !item.str.trim()) continue;
    const t = item.transform as Matrix;
    const fontSize = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]) || 1;
    const [vx, vy] = viewport.convertToViewportPoint(t[4], t[5]);
    const bucket = Math.round(vy / 3) * 3;
    const list = rows.get(bucket) ?? [];
    list.push({ x: vx, str: item.str, fontSize });
    rows.set(bucket, list);
  }

  const lines: TextLine[] = [];
  for (const [y, entries] of rows) {
    entries.sort((a, b) => a.x - b.x);
    const text = entries
      .map((e) => e.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    const fontSize =
      entries.reduce((sum, e) => sum + e.fontSize, 0) / entries.length;
    lines.push({ y, text, fontSize });
  }

  lines.sort((a, b) => a.y - b.y);
  return lines;
}

function groupLinesIntoBlocks(lines: TextLine[]): TextBlock[] {
  if (lines.length === 0) return [];

  const blocks: { y: number; texts: string[]; sizes: number[] }[] = [
    { y: lines[0].y, texts: [lines[0].text], sizes: [lines[0].fontSize] },
  ];

  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1];
    const line = lines[i];
    const gap = line.y - prev.y;
    const avgFont = (prev.fontSize + line.fontSize) / 2;
    const sameBlock = gap < avgFont * 1.7 && Math.abs(line.fontSize - prev.fontSize) < 2;

    if (sameBlock) {
      const current = blocks[blocks.length - 1];
      current.texts.push(line.text);
      current.sizes.push(line.fontSize);
    } else {
      blocks.push({ y: line.y, texts: [line.text], sizes: [line.fontSize] });
    }
  }

  return blocks.map((b) => ({
    y: b.y,
    text: b.texts.join(" ").replace(/\s+/g, " ").trim(),
    fontSize: b.sizes.reduce((sum, s) => sum + s, 0) / b.sizes.length,
  }));
}

async function extractImageBlocks(
  page: any,
  viewport: any,
  pageCanvas: HTMLCanvasElement,
  pdfjsLib: typeof import("pdfjs-dist")
): Promise<ImageBlock[]> {
  const opList = await page.getOperatorList();
  const { OPS } = pdfjsLib;

  const stack: Matrix[] = [];
  let ctm: Matrix = [1, 0, 0, 1, 0, 0];
  const images: ImageBlock[] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];

    if (fn === OPS.save || fn === OPS.paintFormXObjectBegin) {
      stack.push(ctm);
    } else if (fn === OPS.restore || fn === OPS.paintFormXObjectEnd) {
      ctm = stack.pop() ?? ctm;
    } else if (fn === OPS.transform) {
      const args = opList.argsArray[i] as Matrix;
      ctm = multiplyMatrix(args, ctm);
    } else if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat) {
      const corners = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ].map(([x, y]) => transformPoint(ctm, x, y));

      const pdfXs = corners.map((c) => c[0]);
      const pdfYs = corners.map((c) => c[1]);
      const p1 = viewport.convertToViewportPoint(Math.min(...pdfXs), Math.min(...pdfYs));
      const p2 = viewport.convertToViewportPoint(Math.max(...pdfXs), Math.max(...pdfYs));

      const left = Math.max(0, Math.min(p1[0], p2[0]));
      const top = Math.max(0, Math.min(p1[1], p2[1]));
      const width = Math.min(pageCanvas.width - left, Math.abs(p2[0] - p1[0]));
      const height = Math.min(pageCanvas.height - top, Math.abs(p2[1] - p1[1]));

      if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) continue;

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = width;
      cropCanvas.height = height;
      const cropCtx = cropCanvas.getContext("2d");
      if (!cropCtx) continue;
      cropCtx.drawImage(pageCanvas, left, top, width, height, 0, 0, width, height);

      images.push({ y: top, dataUrl: cropCanvas.toDataURL("image/png") });
    }
  }

  return images;
}

export async function convertPdfToBlocks(
  file: File,
  onProgress?: (page: number, totalPages: number) => void
): Promise<ContentBlock[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({
    data: buffer,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  }).promise;

  const perPage: { textBlocks: TextBlock[]; imageBlocks: ImageBlock[] }[] = [];
  const allFontSizes: number[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const lines = await extractTextLines(page, viewport);
    const textBlocks = groupLinesIntoBlocks(lines);
    const imageBlocks = await extractImageBlocks(page, viewport, canvas, pdfjsLib);

    perPage.push({ textBlocks, imageBlocks });
    allFontSizes.push(...textBlocks.map((b) => b.fontSize));
    onProgress?.(pageNum, doc.numPages);
  }

  const sortedSizes = [...allFontSizes].sort((a, b) => a - b);
  const bodySize = sortedSizes[Math.floor(sortedSizes.length / 2)] ?? 10;

  const blocks: ContentBlock[] = [];

  for (const { textBlocks, imageBlocks } of perPage) {
    type Combined =
      | { y: number; kind: "text"; text: string; fontSize: number }
      | { y: number; kind: "image"; dataUrl: string };

    const combined: Combined[] = [
      ...textBlocks.map((b) => ({ y: b.y, kind: "text" as const, text: b.text, fontSize: b.fontSize })),
      ...imageBlocks.map((b) => ({ y: b.y, kind: "image" as const, dataUrl: b.dataUrl })),
    ];
    combined.sort((a, b) => a.y - b.y);

    for (const item of combined) {
      if (item.kind === "image") {
        blocks.push({ type: "image", url: item.dataUrl });
        continue;
      }
      const wordCount = item.text.split(/\s+/).length;
      const isHeading = item.fontSize >= bodySize * 1.15 && wordCount <= 14;
      blocks.push({
        type: isHeading ? "heading" : "paragraph",
        text: item.text,
      });
    }
  }

  return blocks;
}
