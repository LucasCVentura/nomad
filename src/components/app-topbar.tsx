"use client";

import Link from "next/link";
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

export function AppTopbar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-6">
      <div className="flex items-center gap-5">
        <p className="font-heading text-lg text-foreground">Meus conteúdos</p>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground lg:hidden">
          <Link href="/app" className="hover:text-foreground">
            Conteúdos
          </Link>
          <Link href="/loja" className="hover:text-foreground">
            Loja
          </Link>
        </nav>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="size-8">
            <AvatarFallback className="bg-rose/15 text-xs text-rose">
              MC
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link href="/" />}
            className="text-destructive"
          >
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
