import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminTopbar } from "@/components/admin-topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!supabaseConfigured) {
    redirect("/");
  }

  const supabase = await createClient();
  // getSession() reads the already-verified cookie instead of re-checking
  // with the Auth server — middleware just did that check for this exact
  // route, and the is_admin query below is itself protected by RLS.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/entrar?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/app");
  }

  return (
    <div className="flex flex-1">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
