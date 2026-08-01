import { Users, UserCheck, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AlunasGrid, type AlunaRow } from "@/components/admin/alunas-grid";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminAlunosPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: purchases }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, created_at")
      .eq("is_admin", false)
      .order("created_at", { ascending: false }),
    supabase.from("purchases").select("user_id, contents(price)"),
  ]);

  const byStudent = new Map<string, { count: number; total: number }>();
  for (const p of purchases ?? []) {
    const entry = byStudent.get(p.user_id) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += p.contents?.price ?? 0;
    byStudent.set(p.user_id, entry);
  }

  const rows: AlunaRow[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    name: profile.name ?? "Aluna",
    email: profile.email ?? "",
    joinedAt: profile.created_at,
    courseCount: byStudent.get(profile.id)?.count ?? 0,
    totalSpent: byStudent.get(profile.id)?.total ?? 0,
  }));

  const buyers = rows.filter((r) => r.courseCount > 0);
  const totalRevenue = rows.reduce((sum, r) => sum + r.totalSpent, 0);
  const averageTicket = buyers.length > 0 ? totalRevenue / buyers.length : 0;

  const stats = [
    { label: "Alunas cadastradas", value: String(rows.length), icon: Users },
    { label: "Já compraram", value: String(buyers.length), icon: UserCheck },
    { label: "Ticket médio", value: formatCurrency(averageTicket), icon: Wallet },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-rose/15 text-rose">
              <stat.icon className="size-4" />
            </div>
            <p className="font-heading text-2xl text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <AlunasGrid rows={rows} />
      </div>
    </div>
  );
}
