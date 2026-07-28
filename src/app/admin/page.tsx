import { GraduationCap, ShoppingBag, FileStack, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [studentsRes, publishedRes, salesRes, purchasesWithPrice, recentRes] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("contents")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("purchases").select("*", { count: "exact", head: true }),
      supabase.from("purchases").select("contents(price)"),
      supabase
        .from("purchases")
        .select("purchased_at, profiles(name), contents(title)")
        .order("purchased_at", { ascending: false })
        .limit(6),
    ]);

  const revenue = (purchasesWithPrice.data ?? []).reduce(
    (sum, row) => sum + (row.contents?.price ?? 0),
    0
  );

  const stats = [
    {
      label: "Receita total",
      value: formatCurrency(revenue),
      icon: DollarSign,
    },
    {
      label: "Alunas cadastradas",
      value: studentsRes.count ?? 0,
      icon: GraduationCap,
    },
    {
      label: "Conteúdos publicados",
      value: publishedRes.count ?? 0,
      icon: FileStack,
    },
    {
      label: "Vendas realizadas",
      value: salesRes.count ?? 0,
      icon: ShoppingBag,
    },
  ];

  const recent = recentRes.data ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/60 bg-card p-5"
          >
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-rose/15 text-rose">
              <stat.icon className="size-4" />
            </div>
            <p className="font-heading text-2xl text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5">
        <p className="mb-4 font-heading text-lg text-foreground">
          Vendas recentes
        </p>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma venda registrada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {recent.map((sale, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4 text-sm"
              >
                <div>
                  <p className="text-foreground">{sale.contents?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale.profiles?.name ?? "Aluna"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(sale.purchased_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
