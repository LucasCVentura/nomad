import "server-only";

// A chave dá acesso total à conta financeira — nunca pode chegar ao
// navegador, por isso este módulo é server-only e nada aqui é NEXT_PUBLIC_.
const API_KEY = process.env.ASAAS_API_KEY;

// Sandbox e produção são contas distintas, com chaves distintas. O padrão é
// sandbox: esquecer de configurar tem que dar erro de teste, não cobrança de
// verdade na conta da Dra.
const BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

export class AsaasError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown
  ) {
    super(message);
    this.name = "AsaasError";
  }
}

async function request<T>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  if (!API_KEY) {
    throw new AsaasError("ASAAS_API_KEY não configurada", 500, null);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      access_token: API_KEY,
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    // O Asaas devolve os erros em `errors: [{ code, description }]`; a
    // descrição é escrita em português e serve para mostrar à Dra./aluna.
    const described = Array.isArray(body?.errors)
      ? body.errors.map((e: { description?: string }) => e.description).filter(Boolean).join("; ")
      : null;
    throw new AsaasError(described || `Asaas respondeu ${response.status}`, response.status, body);
  }

  return body as T;
}

export type AsaasCustomer = { id: string };

export function createCustomer(input: {
  name: string;
  cpfCnpj: string;
  email?: string;
  externalReference?: string;
}) {
  return request<AsaasCustomer>("/customers", { method: "POST", body: input });
}

export type AsaasPayment = {
  id: string;
  status: string;
  value: number;
  invoiceUrl: string;
};

export function createPayment(input: {
  customer: string;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}) {
  return request<AsaasPayment>("/payments", {
    method: "POST",
    body: {
      ...input,
      // Deixa a aluna escolher Pix, boleto ou cartão na própria página do
      // Asaas, em vez de decidirmos por ela antes de saber o que ela prefere.
      billingType: "UNDEFINED",
    },
  });
}

export function getPayment(id: string) {
  return request<AsaasPayment>(`/payments/${id}`);
}

// Data no formato que o Asaas espera (YYYY-MM-DD).
export function dueDateFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
