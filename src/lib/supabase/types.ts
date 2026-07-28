// database.types.ts is auto-generated (`supabase gen types typescript`) —
// regenerate it whenever the schema changes instead of hand-editing it.
export type { Database, Json } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; alt?: string };

export type ContentStatus = "draft" | "published";

export type ContentRow = Omit<
  Database["public"]["Tables"]["contents"]["Row"],
  "body" | "status"
> & {
  body: ContentBlock[];
  status: ContentStatus;
};
