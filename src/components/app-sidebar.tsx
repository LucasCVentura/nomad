"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ShoppingBag, MessageCircle, Settings2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Meus conteúdos", icon: LayoutGrid },
  { href: "/loja", label: "Loja", icon: ShoppingBag },
  { href: "#", label: "Comunidade", icon: MessageCircle, soon: true },
  { href: "#", label: "Configurações", icon: Settings2, soon: true },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 px-2">
        <Logo />
      </Link>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-disabled={item.soon}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-rose/15 text-rose"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                item.soon && "pointer-events-none opacity-40"
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon className="size-4" />
                {item.label}
              </span>
              {item.soon && (
                <span className="text-[10px] tracking-wide uppercase">Em breve</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
