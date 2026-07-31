"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ShoppingBag, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Conteúdos", icon: LayoutGrid },
  { href: "/app/loja", label: "Loja", icon: ShoppingBag },
  { href: "/app/pedidos", label: "Pedidos", icon: Receipt },
  { href: "/app/conta", label: "Conta", icon: User },
];

// Mobile-only primary navigation — a real bottom tab bar instead of the
// cramped text links that used to live in the topbar, so the app reads as
// a native app (thumb-reachable, always visible) rather than a shrunk
// desktop layout. Hidden at the same breakpoint AppSidebar takes over.
export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/60 bg-background/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active =
          item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]",
              active ? "text-rose" : "text-muted-foreground"
            )}
          >
            <item.icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
