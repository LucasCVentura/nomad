import type { PageTextBlock } from "@/lib/supabase/types";

export type HighlightRect = {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
};

type Band = { left: number; right: number; top: number; bottom: number };

// Two word boxes belong to the same drawn line only if they genuinely
// overlap vertically *and* the second one continues to the right of where
// the run already reached. The horizontal test is what separates a wrapped
// line from a continuing one: a wrap jumps back to the left margin, while
// the next word on the same line starts where the previous ended.
const SAME_LINE_VERTICAL_OVERLAP = 0.5;
const SAME_LINE_BACKTRACK_TOLERANCE_PCT = 1;

/**
 * Words are stored one per glyph-run, each with its own measured box.
 * Drawing one div per word leaves a visible gap wherever an inter-word
 * space falls — glaring on justified text, where those gaps get stretched
 * wide — so a highlight reads as a row of disconnected pills instead of one
 * sweep of a marker. Merging every run of words that share a line into a
 * single rect spanning first-left → last-right closes those gaps, and
 * collapses a paragraph-sized highlight from ~60 nodes down to one per line.
 */
export function getHighlightRects(
  tb: PageTextBlock,
  range: { start: number; end: number }
): HighlightRect[] {
  const bands: Band[] = [];
  let cursor = 0;

  for (const word of tb.words) {
    const start = cursor;
    const end = start + word.text.length;
    cursor = end;
    if (end <= range.start || start >= range.end) continue;

    const band: Band = {
      left: word.xPct,
      right: word.xPct + word.widthPct,
      top: word.yPct,
      bottom: word.yPct + word.heightPct,
    };

    const open = bands[bands.length - 1];
    if (open) {
      const overlap =
        Math.min(band.bottom, open.bottom) - Math.max(band.top, open.top);
      const shortest = Math.min(band.bottom - band.top, open.bottom - open.top);
      const sameLine =
        overlap > shortest * SAME_LINE_VERTICAL_OVERLAP &&
        band.left >= open.right - SAME_LINE_BACKTRACK_TOLERANCE_PCT;

      if (sameLine) {
        open.left = Math.min(open.left, band.left);
        open.right = Math.max(open.right, band.right);
        open.top = Math.min(open.top, band.top);
        open.bottom = Math.max(open.bottom, band.bottom);
        continue;
      }
    }
    bands.push(band);
  }

  return bands.map((b) => ({
    leftPct: b.left,
    topPct: b.top,
    widthPct: b.right - b.left,
    heightPct: b.bottom - b.top,
  }));
}

export type PageHit = { tb: PageTextBlock; start: number; end: number };

// How far outside a word its own box a point may still land and count as
// aiming at it. Vertical slack is measured in multiples of that word's
// height (roughly "within a line and a half"), horizontal slack as a share
// of the page width — enough to grab the last word by clicking past the end
// of a line, but not so much that a click in a margin, on a figure, or on
// the blank bottom half of a page snaps to some distant word.
const MAX_VERTICAL_SLACK = 1.4;
const MAX_HORIZONTAL_SLACK_PCT = 14;

// Being on the wrong line is a much worse miss than being a few characters
// off along one, so vertical distance is weighted up before comparing.
const VERTICAL_BIAS = 2.5;

/**
 * Maps a point (as a % of the page image) to the word being aimed at,
 * returning that word's exact [start,end) range within its paragraph's text
 * — every word already carries its own real measured box, so no snapping
 * step is needed afterward. Returns null when the point isn't plausibly on
 * any line of text, so clicks on blank space do nothing at all rather than
 * silently selecting whatever happened to be nearest.
 *
 * `aspectRatio` (page width / height) converts the y percentages into the
 * same physical units as the x ones before distances get compared.
 */
export function hitTestPage(
  textBlocks: PageTextBlock[],
  xPct: number,
  yPct: number,
  aspectRatio: number
): PageHit | null {
  let best: (PageHit & { dist: number; inside: boolean }) | null = null;

  for (const tb of textBlocks) {
    let cursor = 0;
    for (const word of tb.words) {
      const start = cursor;
      const end = start + word.text.length;
      cursor = end;

      const left = word.xPct;
      const right = word.xPct + word.widthPct;
      const top = word.yPct;
      const bottom = word.yPct + word.heightPct;

      // Distance to the box itself (zero while inside it), not to its
      // centre — otherwise a long word is treated as further away than a
      // short one the pointer is nowhere near.
      const dx = Math.max(left - xPct, 0, xPct - right);
      const dy = Math.max(top - yPct, 0, yPct - bottom);
      const inside = dx === 0 && dy === 0;

      if (
        !inside &&
        (dy > word.heightPct * MAX_VERTICAL_SLACK || dx > MAX_HORIZONTAL_SLACK_PCT)
      ) {
        continue;
      }

      const dist = Math.hypot(dx, (dy / aspectRatio) * VERTICAL_BIAS);
      if (
        best === null ||
        (inside && !best.inside) ||
        (inside === best.inside && dist < best.dist)
      ) {
        best = { tb, start, end, dist, inside };
      }
    }
  }

  return best ? { tb: best.tb, start: best.start, end: best.end } : null;
}
