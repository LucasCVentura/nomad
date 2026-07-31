"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileStack, Users, MessageCircle, Star } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useAdminUnreadTotal } from "@/lib/use-admin-unread-total";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/conteudos", label: "Conteúdos", icon: FileStack },
  { href: "/admin/alunos", label: "Alunos", icon: Users },
  { href: "/admin/comunidade", label: "Chat", icon: MessageCircle },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: Star },
];

export function AdminSidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const liveUnreadCount = useAdminUnreadTotal(unreadCount);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 px-4 py-6 lg:flex">
      <Link href="/" className="mb-1 px-2">
        <Logo />
      </Link>
      <p className="mb-7 px-2 text-xs text-muted-foreground">Painel admin</p>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const showUnread = item.href === "/admin/comunidade" && liveUnreadCount > 0;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-rose/15 text-rose"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon className="size-4" />
                {item.label}
              </span>
              {showUnread && (
                <span className="flex size-4 items-center justify-center rounded-full bg-rose text-[10px] text-rose-foreground">
                  {liveUnreadCount}
                </span>
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
