"use client";

import { useMemo, useState } from "react";
import { Search, Undo2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, avatarStyle } from "@/lib/utils";

export type OrderRow = {
  id: string;
  studentId: string;
  studentName: string;
  itemTitles: string[];
  total: number;
  status: "pending" | "paid" | "canceled" | "refunded";
  createdAt: string;
  paidAt: string | null;
  refundRequestedAt: string | null;
  asaasPaymentId: string | null;
};

const STATUS_LABEL: Record<OrderRow["status"], string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  canceled: "Cancelado",
  refunded: "Estornado",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Filter = "todos" | "reembolso" | "pago" | "pendente" | "encerrado";

export function PedidosList({ orders }: { orders: OrderRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter === "reembolso" && !o.refundRequestedAt) return false;
      if (filter === "pago" && (o.status !== "paid" || o.refundRequestedAt)) return false;
      if (filter === "pendente" && o.status !== "pending") return false;
      if (filter === "encerrado" && !["canceled", "refunded"].includes(o.status)) return false;
      if (q && !o.studentName.toLowerCase().includes(q) && !o.itemTitles.some((t) => t.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [orders, query, filter]);

  // Reembolso pedido sempre no topo, senão a mais recente primeiro.
  const sorted = [...filtered].sort((a, b) => {
    if (!!a.refundRequestedAt !== !!b.refundRequestedAt) return a.refundRequestedAt ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const tabs: { value: Filter; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "reembolso", label: "Reembolso pedido" },
    { value: "pago", label: "Pagos" },
    { value: "pendente", label: "Pendentes" },
    { value: "encerrado", label: "Cancelados/estornados" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por aluna ou conteúdo..."
            className="h-10 w-full rounded-xl border border-border/60 bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 rounded-xl border border-border/60 bg-card p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              filter === tab.value
                ? "bg-rose/15 text-rose"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhum pedido encontrado pra esse filtro.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {sorted.map((order) => (
            <div
              key={order.id}
              className={`flex items-start gap-4 rounded-2xl border p-5 ${
                order.refundRequestedAt
                  ? "border-gold/50 bg-gold/5"
                  : "border-border/60 bg-card"
              }`}
            >
              <Avatar size="lg" className="shrink-0">
                <AvatarFallback className={`text-sm font-medium ${avatarStyle(order.studentId)}`}>
                  {getInitials(order.studentName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-heading text-base text-foreground">{order.studentName}</span>
                  <span className="font-heading text-lg text-foreground tabular-nums">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {order.itemTitles.join(", ")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{STATUS_LABEL[order.status]}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span>
                  {order.asaasPaymentId && <span>Asaas: {order.asaasPaymentId}</span>}
                </div>
                {order.refundRequestedAt && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-gold/15 px-3 py-2 text-xs text-gold">
                    <Undo2 className="size-3.5 shrink-0" />
                    Reembolso solicitado em{" "}
                    {new Date(order.refundRequestedAt).toLocaleDateString("pt-BR")} — processe no
                    painel da Asaas e o acesso ao conteúdo é removido sozinho quando o estorno for
                    confirmado.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
