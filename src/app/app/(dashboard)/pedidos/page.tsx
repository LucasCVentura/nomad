import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, status, total, invoice_url, created_at, order_items(price, contents(title))")
    .order("created_at", { ascending: false });

  const rows = orders ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl">
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
            const status = STATUS[order.status as keyof typeof STATUS] ?? STATUS.pending;
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
