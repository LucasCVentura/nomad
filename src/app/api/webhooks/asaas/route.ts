import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PAYMENT_RECEIVED é quando o dinheiro entra na conta; no cartão vem semanas
// depois, porque a liquidação demora. PAYMENT_CONFIRMED é o pagamento aceito,
// e é o que chega primeiro nesse caso — esperar o outro deixaria a aluna sem o
// curso que ela acabou de pagar. Os dois liberam, o que vier primeiro; a
// segunda entrega cai na checagem de idempotência abaixo.
const PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const CANCELED_EVENTS = new Set([
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
]);

export async function POST(request: Request) {
  // Qualquer um pode descobrir esta URL, então sem o token combinado no painel
  // do Asaas a chamada não passa — senão liberar curso de graça seria um curl.
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) {
    console.error("[webhook asaas] ASAAS_WEBHOOK_TOKEN não configurado");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }
  if (request.headers.get("asaas-access-token") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { event?: string; payment?: { id?: string; externalReference?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = body.event ?? "";
  const paymentId = body.payment?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "sem payment.id" }, { status: 400 });
  }

  // Eventos que não mudam o acesso (criada, vencida, atualizada...) são aceitos
  // em silêncio: responder outra coisa faria o Asaas reenviar para sempre.
  if (!PAID_EVENTS.has(event) && !CANCELED_EVENTS.has(event)) {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status")
    .eq("asaas_payment_id", paymentId)
    .maybeSingle();

  if (!order) {
    // Pode ser uma cobrança criada fora do site (a Dra. cobrando alguém pelo
    // painel do Asaas). Não é erro nosso — aceitar evita reentrega infinita.
    console.warn("[webhook asaas] pagamento sem pedido correspondente:", paymentId);
    return NextResponse.json({ ok: true, unknownPayment: true });
  }

  if (CANCELED_EVENTS.has(event)) {
    await admin
      .from("orders")
      .update({ status: event === "PAYMENT_REFUNDED" ? "refunded" : "canceled" })
      .eq("id", order.id);
    // O acesso já concedido não é revogado automaticamente: estorno costuma
    // vir com conversa, e tirar o curso de alguém é decisão da Dra., que pode
    // fazer isso pelo painel de alunas.
    return NextResponse.json({ ok: true });
  }

  // O Asaas reenvia o mesmo evento até receber 200, e manda CONFIRMED e
  // RECEIVED para a mesma cobrança — daí a saída antecipada.
  if (order.status === "paid") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  const { data: items } = await admin
    .from("order_items")
    .select("content_id")
    .eq("order_id", order.id);

  if (items && items.length > 0) {
    // upsert e não insert: se a aluna já tiver o curso por outro caminho (a
    // Dra. liberou na mão, por exemplo), a chave única não pode derrubar o
    // resto do pedido junto.
    const { error } = await admin.from("purchases").upsert(
      items.map((item) => ({ user_id: order.user_id, content_id: item.content_id })),
      { onConflict: "user_id,content_id", ignoreDuplicates: true }
    );
    if (error) {
      // Devolver erro faz o Asaas tentar de novo, que é o que queremos: o
      // pedido segue pendente até o acesso realmente existir.
      console.error("[webhook asaas] falha ao liberar acesso:", error);
      return NextResponse.json({ error: "falha ao liberar acesso" }, { status: 500 });
    }
  }

  await admin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", order.id);

  return NextResponse.json({ ok: true });
}
