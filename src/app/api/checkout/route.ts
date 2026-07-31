import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AsaasError, createCustomer, createPayment, dueDateFromNow } from "@/lib/asaas";

// Prazo da cobrança. Pix e cartão são na hora; o boleto é quem precisa de
// folga, e vencer rápido demais só geraria pedido morto.
const DUE_IN_DAYS = 3;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

// Valida o CPF pelos dígitos verificadores. O Asaas rejeitaria um CPF inválido
// de qualquer forma, mas o erro dele volta genérico no meio do checkout — vale
// mais dizer na hora em que a aluna digitou.
function isValidCpf(cpf: string) {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const [length, position] of [
    [9, 10],
    [10, 11],
  ]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (position - i);
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== Number(cpf[length])) return false;
  }
  return true;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  let body: { contentIds?: unknown; cpf?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const contentIds = Array.isArray(body.contentIds)
    ? body.contentIds.filter((id): id is string => typeof id === "string")
    : [];
  if (contentIds.length === 0) {
    return NextResponse.json({ error: "Seu carrinho está vazio." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("name, email, cpf, asaas_customer_id")
    .eq("id", user.id)
    .single();

  // CPF é exigido pelo Asaas para criar o cliente. Pedido uma vez e guardado;
  // o código devolvido é o que faz o carrinho abrir o campo.
  const submittedCpf = typeof body.cpf === "string" ? onlyDigits(body.cpf) : "";
  const cpf = profile?.cpf ?? submittedCpf;
  if (!cpf) {
    return NextResponse.json({ error: "cpf_required" }, { status: 422 });
  }
  if (!isValidCpf(cpf)) {
    return NextResponse.json({ error: "CPF inválido. Confira os números." }, { status: 400 });
  }

  // Preços vêm do banco, nunca do que o navegador mandou — senão bastaria
  // editar a requisição para comprar por um real.
  const { data: contents } = await admin
    .from("contents")
    .select("id, title, price, status")
    .in("id", contentIds)
    .eq("status", "published");

  if (!contents || contents.length === 0) {
    return NextResponse.json({ error: "Conteúdo indisponível." }, { status: 400 });
  }

  // Já comprados saem do pedido: pagar de novo pelo mesmo curso não deveria
  // ser possível nem por engano (duas abas, botão clicado duas vezes).
  const { data: owned } = await admin
    .from("purchases")
    .select("content_id")
    .eq("user_id", user.id)
    .in("content_id", contents.map((c) => c.id));
  const ownedIds = new Set((owned ?? []).map((p) => p.content_id));
  const items = contents.filter((c) => !ownedIds.has(c.id));

  if (items.length === 0) {
    return NextResponse.json({ error: "Você já tem acesso a esses conteúdos." }, { status: 409 });
  }

  const total = items.reduce((sum, item) => sum + Number(item.price), 0);
  if (total <= 0) {
    return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
  }

  try {
    // Cliente no Asaas: criado uma vez por aluna e reaproveitado depois.
    let customerId = profile?.asaas_customer_id ?? null;
    if (!customerId) {
      const customer = await createCustomer({
        name: profile?.name || user.email || "Aluna",
        cpfCnpj: cpf,
        email: profile?.email || user.email || undefined,
        externalReference: user.id,
      });
      customerId = customer.id;
    }
    await admin
      .from("profiles")
      .update({ cpf, asaas_customer_id: customerId })
      .eq("id", user.id);

    // O pedido nasce antes da cobrança para poder ir como externalReference —
    // assim um evento do Asaas sempre aponta de volta para um pedido nosso,
    // mesmo que a resposta da criação se perca no caminho.
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({ user_id: user.id, total, status: "pending" })
      .select("id")
      .single();
    if (orderError || !order) throw orderError ?? new Error("falha ao criar o pedido");

    const { error: itemsError } = await admin.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        content_id: item.id,
        price: Number(item.price),
      }))
    );
    if (itemsError) throw itemsError;

    const payment = await createPayment({
      customer: customerId,
      value: total,
      dueDate: dueDateFromNow(DUE_IN_DAYS),
      description:
        items.length === 1
          ? items[0].title
          : `${items.length} conteúdos — Manual NF`,
      externalReference: order.id,
    });

    await admin
      .from("orders")
      .update({ asaas_payment_id: payment.id, invoice_url: payment.invoiceUrl })
      .eq("id", order.id);

    return NextResponse.json({ invoiceUrl: payment.invoiceUrl, orderId: order.id });
  } catch (err) {
    console.error("[checkout]", err);
    const message =
      err instanceof AsaasError
        ? `Não consegui gerar a cobrança (${err.message}).`
        : "Não consegui gerar a cobrança. Tente de novo em instantes.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
