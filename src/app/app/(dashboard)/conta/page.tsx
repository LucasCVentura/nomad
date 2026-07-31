import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/entrar?next=/app/conta");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", session.user.id)
    .maybeSingle();

  const name = profile?.name ?? session.user.email ?? "";
  const email = profile?.email ?? session.user.email ?? "";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-rose/15 font-heading text-xl text-rose">
          {getInitials(name)}
        </div>
        <div>
          <p className="font-heading text-lg text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border/60">
        <Link
          href="/app/loja"
          className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-foreground hover:bg-muted"
        >
          <span className="flex items-center gap-3">
            <ShoppingBag className="size-4 text-muted-foreground" />
            Loja
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
        <SignOutButton className="w-full justify-center px-4 py-3.5" />
      </div>
    </div>
  );
}
