"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIRACLINIC_URL } from "@/lib/constants";

export function ContentRatingModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number) => void;
}) {
  const [step, setStep] = useState<"rating" | "kira">("rating");
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      // Reset for the next time this content (or another one) is completed.
      setStep("rating");
      setHovered(0);
      setSelected(0);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-popover p-6 text-center shadow-2xl shadow-black/40 transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          {step === "rating" ? (
            <>
              <p className="font-heading text-lg text-foreground">Parabéns por concluir! 🎉</p>
              <p className="mt-1 text-sm text-muted-foreground">O que achou desse conteúdo?</p>

              <div className="mt-5 flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setSelected(n)}
                    className="p-1"
                  >
                    <Star
                      className={`size-7 transition-colors ${
                        (hovered || selected) >= n
                          ? "fill-gold text-gold"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Button
                  className="bg-rose text-rose-foreground hover:bg-rose/90"
                  disabled={selected === 0}
                  onClick={() => {
                    onSubmit(selected);
                    setStep("kira");
                  }}
                >
                  Enviar avaliação
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("kira")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Pular
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-gold/15">
                <Sparkles className="size-5 text-gold" />
              </div>
              <p className="mt-3 font-heading text-lg text-foreground">
                Aprendeu a teoria. E na hora de atender?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                O Kiraclinic é o sistema de gestão feito pra quem vive de
                estética — agenda, prontuário e financeiro num só lugar.
                Parceiro do Manual NF.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <Button
                  className="bg-rose text-rose-foreground hover:bg-rose/90"
                  render={<a href={KIRACLINIC_URL} target="_blank" rel="noopener noreferrer" />}
                  nativeButton={false}
                  onClick={() => handleOpenChange(false)}
                >
                  Conhecer o Kiraclinic
                </Button>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Agora não
                </button>
              </div>
            </>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
