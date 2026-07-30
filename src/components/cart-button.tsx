"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

export function CartButton({ className }: { className?: string }) {
  const { items, setOpen } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={() => setOpen(true)}
    >
      <ShoppingCart className="size-4" />
      {items.length > 0 && (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose text-[10px] text-rose-foreground">
          {items.length}
        </span>
      )}
      <span className="sr-only">Carrinho</span>
    </Button>
  );
}
