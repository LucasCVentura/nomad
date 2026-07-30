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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const total = items.reduce((sum, item) => sum + item.price, 0);

  async function handleCheckout() {
    if (!isLoggedIn) {
      setOpen(false);
      router.push("/entrar?next=/app/loja");
      return;
    }
    setCheckingOut(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setCheckingOut(false);
      setOpen(false);
      router.push("/entrar?next=/app/loja");
      return;
    }

    // Inserted one at a time (not as a single bulk insert) so a content the
    // student already owns — e.g. added to the cart in one tab, bought in
    // another — just fails silently for that one row instead of the unique
    // constraint rejecting the whole batch.
    let anySuccess = false;
    for (const item of items) {
      const { error } = await supabase
        .from("purchases")
        .insert({ user_id: user.id, content_id: item.id });
      if (!error) anySuccess = true;
    }

    setCheckingOut(false);
    clear();
    setOpen(false);
    if (anySuccess) {
      router.push("/app");
      router.refresh();
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
            <Button
              className="bg-rose text-rose-foreground hover:bg-rose/90"
              disabled={checkingOut}
              onClick={handleCheckout}
            >
              {checkingOut
                ? "Finalizando..."
                : isLoggedIn
                  ? "Finalizar compra"
                  : "Entrar para finalizar"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
