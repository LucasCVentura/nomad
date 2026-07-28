"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

export function AdminTopbar() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-6">
      <div className="flex items-center gap-4">
        <p className="font-heading text-lg text-foreground">Painel admin</p>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground lg:hidden">
          <Link href="/admin" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/admin/conteudos" className="hover:text-foreground">
            Conteúdos
          </Link>
        </nav>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="size-8">
            <AvatarFallback className="bg-gold/15 text-xs text-gold">
              DN
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Dra. Nathalia</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
