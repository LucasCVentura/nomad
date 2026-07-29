// database.types.ts is auto-generated (`supabase gen types typescript`) —
// regenerate it whenever the schema changes instead of hand-editing it.
export type { Database, Json } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

// One real PDF text line's exact, browser-measured box (via pdf.js's own
// TextLayer — not an estimate), positioned as a percentage of the page's
// width/height so it scales with it.
export type PageTextLine = {
  text: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  fontSizePct: number; // relative to the page's own width, applied via cqw
};

// A group of nearby lines that share one selectable/annotatable "paragraph"
// — a drag-select or highlight can span multiple lines, each still kept at
// its own precise position instead of being reflowed into one guessed box.
export type PageTextBlock = {
  id: string;
  text: string;
  lines: PageTextLine[];
};

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; alt?: string }
  | { type: "video"; url: string; caption?: string }
  // A PDF page rendered as one image (pixel-perfect to the original,
  // including diagrams/columns/tables a text-reflow would mangle) with an
  // invisible text layer on top so it's still selectable/highlightable —
  // this is the standard approach going forward; heading/paragraph/image
  // above are kept only so previously converted content keeps rendering.
  | { type: "page"; url: string; aspectRatio: number; textBlocks: PageTextBlock[] };

export type ContentStatus = "draft" | "published";

export type ContentRow = Omit<
  Database["public"]["Tables"]["contents"]["Row"],
  "body" | "status"
> & {
  body: ContentBlock[];
  status: ContentStatus;
};
