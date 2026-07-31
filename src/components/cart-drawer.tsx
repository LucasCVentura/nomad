"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";

export function CartDrawer() {
  const { items, open, setOpen, removeItem, clear } = useCart();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [needsCpf, setNeedsCpf] = useState(false);
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const total = items.reduce((sum, item) => sum + item.price, 0);

  // A compra passa pelo servidor: ele confere os preços no banco, cria a
  // cobrança no Asaas e devolve a página de pagamento. O navegador nunca
  // libera acesso sozinho — quem faz isso é o webhook, quando o pagamento
  // confirma.
  async function handleCheckout() {
    if (!isLoggedIn) {
      setOpen(false);
      router.push("/entrar?next=/app/loja");
      return;
    }
    setCheckingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentIds: items.map((item) => item.id),
          cpf: cpf || undefined,
        }),
      });
      const data = await response.json();

      // O Asaas exige CPF para criar o cliente. Em vez de pedir de todo mundo
      // no cadastro, ele é pedido aqui, uma vez, e guardado para as próximas.
      if (response.status === 422 && data.error === "cpf_required") {
        setNeedsCpf(true);
        setCheckingOut(false);
        return;
      }
      if (!response.ok) {
        setError(data.error ?? "Não consegui iniciar o pagamento.");
        setCheckingOut(false);
        return;
      }

      // O carrinho só é esvaziado depois que a cobrança existe — se algo
      // falhar antes disso, ela não perde o que tinha escolhido.
      clear();
      window.location.href = data.invoiceUrl;
    } catch {
      setError("Não consegui falar com o servidor. Confira a conexão.");
      setCheckingOut(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Seu carrinho</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Seu carrinho está vazio. Adicione conteúdos na loja.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 py-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-gold/15 to-rose/15">
                    {item.coverImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {item.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={`Remover ${item.title} do carrinho`}
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border/60 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-heading text-lg text-foreground">
                R$ {total.toFixed(2).replace(".", ",")}
              </span>
            </div>
            {needsCpf && (
              <div className="space-y-1.5">
                <label htmlFor="cpf" className="text-sm text-foreground">
                  Seu CPF
                </label>
                <input
                  id="cpf"
                  inputMode="numeric"
                  autoFocus
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Pedido uma única vez, exigido para emitir a cobrança.
                </p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="bg-rose text-rose-foreground hover:bg-rose/90"
              disabled={checkingOut || (needsCpf && cpf.replace(/\D/g, "").length !== 11)}
              onClick={handleCheckout}
            >
              {checkingOut
                ? "Abrindo pagamento..."
                : isLoggedIn
                  ? "Ir para o pagamento"
                  : "Entrar para finalizar"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
