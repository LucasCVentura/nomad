"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

export function AppTopbar() {
  const router = useRouter();
  const [label, setLabel] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const name = (data.user?.user_metadata?.name as string | undefined) ?? data.user?.email;
      if (name) setLabel(getInitials(name));
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

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
              {label}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
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
