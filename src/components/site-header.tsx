import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { Logo } from "@/components/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="/#recursos" className="hover:text-foreground">
            Recursos
          </a>
          <Link href="/loja" className="hover:text-foreground">
            Loja
          </Link>
          <a href="/#comunidade" className="hover:text-foreground">
            Comunidade
          </a>
          <a href="/#duvidas" className="hover:text-foreground">
            Dúvidas
          </a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" render={<Link href="/entrar" />} nativeButton={false}>
            Entrar
          </Button>
          <Button
            size="sm"
            className="bg-rose text-rose-foreground hover:bg-rose/90"
            render={<Link href="/registro" />}
            nativeButton={false}
          >
            Criar conta
          </Button>
        </div>
        <MobileNav />
      </div>
    </header>
  );
}
