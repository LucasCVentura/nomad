"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/loja", label: "Loja" },
  { href: "/#comunidade", label: "Comunidade" },
  { href: "/#duvidas", label: "Dúvidas" },
];

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu className="size-5" />
        <span className="sr-only">Abrir menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-4/5">
        <SheetHeader>
          <SheetTitle>
            Nomad<span className="text-rose">.</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {links.map((link) => (
            <SheetClose
              key={link.href}
              render={<Link href={link.href} />}
              nativeButton={false}
              className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted"
            >
              {link.label}
            </SheetClose>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 p-4">
          <SheetClose
            render={<Link href="/entrar" />}
            nativeButton={false}
            className="flex h-9 items-center justify-center rounded-lg border border-border text-sm text-foreground"
          >
            Entrar
          </SheetClose>
          <SheetClose
            render={<Link href="/registro" />}
            nativeButton={false}
            className="flex h-9 items-center justify-center rounded-lg bg-rose text-sm text-rose-foreground"
          >
            Criar conta
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
