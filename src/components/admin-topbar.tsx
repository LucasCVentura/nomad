"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

const TITLES: Record<string, string> = {
  "/admin": "Painel admin",
  "/admin/conteudos": "Conteúdos",
  "/admin/alunos": "Alunas",
  "/admin/comunidade": "Chat",
};

export function AdminTopbar() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const title =
    Object.entries(TITLES)
      .filter(([href]) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Painel admin";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4 sm:px-6">
      <p className="font-heading text-lg text-foreground">{title}</p>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="size-8">
            <AvatarFallback className="bg-gold/15 text-xs text-gold">
              DN
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Dra. Nathalia</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
