import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Only /app and /admin need a session check. Every other route (landing,
// /loja, /entrar...) used to pay for a Supabase network round-trip on every
// navigation for no reason — this scopes the middleware to where it matters.
export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
