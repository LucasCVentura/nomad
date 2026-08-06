"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileStack, Users, MessageCircle, Star, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminUnreadTotal } from "@/lib/use-admin-unread-total";

const items = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/conteudos", label: "Conteúdos", icon: FileStack },
  { href: "/admin/alunos", label: "Alunas", icon: Users },
  { href: "/admin/pedidos", label: "Pedidos", icon: Receipt },
  { href: "/admin/comunidade", label: "Chat", icon: MessageCircle },
  { href: "/admin/avaliacoes", label: "Notas", icon: Star },
];

// Mobile-only primary navigation, mirroring AdminSidebar — before this the
// admin topbar only linked to 2 of the 4 sections on mobile (Alunos and
// Comunidade had no way in at all besides typing the URL).
export function AdminBottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const liveUnreadCount = useAdminUnreadTotal(unreadCount);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/60 bg-background/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const showUnread = item.href === "/admin/comunidade" && liveUnreadCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]",
              active ? "text-rose" : "text-muted-foreground"
            )}
          >
            <span className="relative">
              <item.icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
              {showUnread && (
                <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-rose text-[9px] text-rose-foreground">
                  {liveUnreadCount}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
