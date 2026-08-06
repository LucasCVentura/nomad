"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function RefundRequestButton({
  orderId,
  withinWindow,
}: {
  orderId: string;
  withinWindow: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const msg = withinWindow
      ? "Solicitar reembolso deste pedido? Você está dentro do prazo de 7 dias do CDC — a Dra. Nathalia vai analisar o pedido."
      : "Já passaram mais de 7 dias da compra, então o reembolso não é mais garantido por lei, mas você ainda pode solicitar — a Dra. Nathalia avalia caso a caso. Solicitar mesmo assim?";
    if (!confirm(msg)) return;

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ refund_requested_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      setError("Não consegui enviar a solicitação. Tente de novo.");
      setLoading(false);
      return;
    }
    setRequested(true);
  }

  if (requested) {
    return <p className="text-xs text-gold">Solicitação enviada — em análise.</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" disabled={loading} onClick={handleClick}>
        <Undo2 className="size-3.5" />
        {loading ? "Enviando..." : "Solicitar reembolso"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
