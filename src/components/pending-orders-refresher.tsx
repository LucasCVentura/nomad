"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// O Asaas devolve a aluna assim que ela paga, mas o webhook que libera o
// acesso chega logo depois — sem isso ela cairia num "aguardando pagamento"
// que só sairia se ela recarregasse a página por conta própria.
export function PendingOrdersRefresher({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => router.refresh(), 4000);
    // Boleto pode demorar dias: depois de alguns minutos, para de insistir
    // em vez de ficar consultando o servidor pelo resto da sessão.
    const stop = window.setTimeout(() => window.clearInterval(interval), 3 * 60 * 1000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, [enabled, router]);

  return null;
}
