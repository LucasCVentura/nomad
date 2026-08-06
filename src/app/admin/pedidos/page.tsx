import { Receipt, DollarSign, Undo2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PedidosList, type OrderRow } from "@/components/admin/pedidos-list";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminPedidosPage() {
  const supabase = await createClient();

  // RLS já limita isto à admin ("Users see own orders, admin sees all").
  const { data: rows } = await supabase
    .from("orders")
    .select(
      "id, user_id, status, total, created_at, paid_at, refund_requested_at, asaas_payment_id, profiles(name), order_items(contents(title))"
    )
    .order("created_at", { ascending: false });

  const orders: OrderRow[] = (rows ?? []).map((o) => ({
    id: o.id,
    studentId: o.user_id,
    studentName: o.profiles?.name ?? "Aluna",
    itemTitles: o.order_items.map((i) => i.contents?.title ?? "Conteúdo"),
    total: Number(o.total),
    status: o.status as OrderRow["status"],
    createdAt: o.created_at,
    paidAt: o.paid_at,
    refundRequestedAt: o.refund_requested_at,
    asaasPaymentId: o.asaas_payment_id,
  }));

  const revenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.total, 0);
  const refundRequests = orders.filter((o) => o.refundRequestedAt).length;

  const stats = [
    { label: "Pedidos no total", value: String(orders.length), icon: Receipt },
    { label: "Receita (pedidos pagos)", value: formatCurrency(revenue), icon: DollarSign },
    { label: "Reembolsos pedidos", value: String(refundRequests), icon: Undo2 },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
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
        <PedidosList orders={orders} />
      </div>
    </div>
  );
}
