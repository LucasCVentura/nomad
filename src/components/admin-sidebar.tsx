"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileStack, Users, MessageCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/conteudos", label: "Conteúdos", icon: FileStack },
  { href: "#", label: "Alunos", icon: Users, soon: true },
  { href: "#", label: "Comunidade", icon: MessageCircle, soon: true },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 px-4 py-6 lg:flex">
      <Link href="/" className="mb-1 px-2">
        <Logo />
      </Link>
      <p className="mb-7 px-2 text-xs text-muted-foreground">Painel admin</p>
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
      <Link
        href="/app"
        className="mt-auto rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        Ver como aluno
      </Link>
    </aside>
  );
}
