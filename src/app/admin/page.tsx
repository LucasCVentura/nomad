import { GraduationCap, ShoppingBag, FileStack, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { getInitials, avatarStyle, timeAgo } from "@/lib/utils";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [studentsRes, publishedRes, salesRes, revenueRes, recentRes] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("contents")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("purchases").select("*", { count: "exact", head: true }),
      // Soma a receita no banco (admin_total_revenue) em vez de baixar toda
      // compra e somar em JS — o count acima já é feito no banco com head:true.
      supabase.rpc("admin_total_revenue"),
      supabase
        .from("purchases")
        .select("user_id, purchased_at, profiles(name), contents(title, price)")
        .order("purchased_at", { ascending: false })
        .limit(6),
    ]);

  const revenue = Number(revenueRes.data ?? 0);

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
            {recent.map((sale, i) => {
              const name = sale.profiles?.name ?? "Aluna";
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-4 text-sm"
                >
                  <Avatar size="sm" className="shrink-0">
                    <AvatarFallback className={`font-medium ${avatarStyle(sale.user_id)}`}>
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-foreground">{sale.contents?.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-foreground tabular-nums">
                      {formatCurrency(sale.contents?.price ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(sale.purchased_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
