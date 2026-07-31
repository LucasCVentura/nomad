"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CartButton } from "@/components/cart-button";
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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

const TITLES: Record<string, string> = {
  "/app": "Meus conteúdos",
  "/app/loja": "Loja",
  "/app/conta": "Minha conta",
  "/app/pedidos": "Meus pedidos",
};

export function AppTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [label, setLabel] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      const name = (user?.user_metadata?.name as string | undefined) ?? user?.email;
      if (name) setLabel(getInitials(name));
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const title = TITLES[pathname] ?? "Meus conteúdos";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4 sm:px-6">
      <p className="font-heading text-lg text-foreground">{title}</p>
      <div className="flex items-center gap-2">
        <CartButton />
        <DropdownMenu>
          <DropdownMenuTrigger className="hidden lg:flex">
            <Avatar className="size-8">
              <AvatarFallback className="bg-rose/15 text-xs text-rose">
                {label}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
