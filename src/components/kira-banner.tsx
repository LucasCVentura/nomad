"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIRACLINIC_URL } from "@/lib/constants";

const STORAGE_KEY = "manualnf-kira-banner-dismissed";

export function KiraBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="mb-8 flex flex-col items-start gap-3 rounded-2xl border border-gold/30 bg-linear-to-r from-gold/10 to-rose/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/15">
          <Sparkles className="size-4 text-gold" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Aprendeu por aqui? Atenda com o Kiraclinic.
          </p>
          <p className="text-sm text-muted-foreground">
            Sistema de gestão parceiro do Manual NF — agenda, prontuário e
            financeiro num só lugar, feito pra estética.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <Button
          size="sm"
          className="bg-rose text-rose-foreground hover:bg-rose/90"
          render={<a href={KIRACLINIC_URL} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
        >
          Conhecer o Kira
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
