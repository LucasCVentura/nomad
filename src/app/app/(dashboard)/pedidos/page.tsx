import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { PendingOrdersRefresher } from "@/components/pending-orders-refresher";
import { RefundRequestButton } from "@/components/refund-request-button";

// Prazo do direito de arrependimento (CDC, Termos de Uso seção 5). Passado
// isso o pedido não é bloqueado — a cláusula fala em "acesso substancial",
// que é julgamento da Dra., não uma regra automática — só deixa de ser
// garantido por lei, e o botão avisa isso em vez de simplesmente sumir.
const REFUND_WINDOW_DAYS = 7;

// Pix cai em segundos, boleto pode levar dias — então esta tela não promete
// nada que ainda não aconteceu. Enquanto o webhook não confirma, o pedido
// aparece como pendente, com o link para pagar de novo se ela fechou a página
// do Asaas antes de terminar.
const STATUS = {
  paid: {
    label: "Pago",
    hint: "Acesso liberado. O conteúdo já está na sua área de estudos.",
    icon: CheckCircle2,
    className: "text-rose",
  },
  pending: {
    label: "Aguardando pagamento",
    hint: "Assim que o pagamento for confirmado, o conteúdo aparece automaticamente na sua área de estudos. Pix costuma levar segundos; boleto pode levar até 3 dias úteis.",
    icon: Clock,
    className: "text-gold",
  },
  canceled: {
    label: "Cancelado",
    hint: "Esta cobrança foi cancelada.",
    icon: XCircle,
    className: "text-muted-foreground",
  },
  refunded: {
    label: "Estornado",
    hint: "O valor desta compra foi estornado.",
    icon: XCircle,
    className: "text-muted-foreground",
  },
  refund_requested: {
    label: "Reembolso solicitado",
    hint: "Sua solicitação está em análise. A Dra. Nathalia vai entrar em contato.",
    icon: Clock,
    className: "text-gold",
  },
} as const;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function PedidosPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/entrar?next=/app/pedidos");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, total, invoice_url, created_at, paid_at, refund_requested_at, order_items(price, contents(title))"
    )
    .order("created_at", { ascending: false });

  const rows = orders ?? [];

  const hasPending = rows.some((order) => order.status === "pending");

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PendingOrdersRefresher enabled={hasPending} />
      <p className="text-sm text-muted-foreground">
        {rows.length === 0
          ? "Você ainda não fez nenhum pedido."
          : `${rows.length} pedido(s).`}
      </p>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Quando você comprar um conteúdo, ele aparece aqui.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            render={<Link href="/app/loja" />}
            nativeButton={false}
          >
            Ver a loja
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((order) => {
            const refundable = order.status === "paid" && !order.refund_requested_at;
            const statusKey =
              order.status === "paid" && order.refund_requested_at ? "refund_requested" : order.status;
            const status = STATUS[statusKey as keyof typeof STATUS] ?? STATUS.pending;
            const daysSincePaid = order.paid_at
              ? Math.floor((Date.now() - new Date(order.paid_at).getTime()) / 86_400_000)
              : null;
            const withinWindow = daysSincePaid !== null && daysSincePaid <= REFUND_WINDOW_DAYS;
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-border/60 bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`flex items-center gap-1.5 text-sm ${status.className}`}>
                    <status.icon className="size-4" />
                    {status.label}
                  </span>
                  <span className="font-heading text-lg text-foreground">
                    {formatCurrency(Number(order.total))}
                  </span>
                </div>

                <ul className="mt-3 space-y-1">
                  {order.order_items.map((item, i) => (
                    <li key={i} className="text-sm text-foreground">
                      {item.contents?.title ?? "Conteúdo"}
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-xs text-muted-foreground">{status.hint}</p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  {order.status === "pending" && order.invoice_url && (
                    <a
                      href={order.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-rose hover:underline"
                    >
                      Pagar agora
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                  {refundable && (
                    <RefundRequestButton orderId={order.id} withinWindow={withinWindow} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
