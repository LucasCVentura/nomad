import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

// createBrowserClient already caches a singleton internally (in the
// browser), so this just exposes it with our Database typing.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
