import Link from "next/link";
import { AtSign } from "lucide-react";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Materiais de estudo e comunidade criados pela Dra. Nathalia pra
            profissionais de estética.
          </p>
          <a
            href="#"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <AtSign className="size-4" />
            @nomad
          </a>
        </div>
        <div>
          <p className="mb-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
            Produto
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="/#recursos" className="hover:text-foreground">
                Recursos
              </a>
            </li>
            <li>
              <a href="/#sobre" className="hover:text-foreground">
                Sobre a Dra. Nathalia
              </a>
            </li>
            <li>
              <Link href="/loja" className="hover:text-foreground">
                Loja
              </Link>
            </li>
            <li>
              <a href="/#comunidade" className="hover:text-foreground">
                Comunidade
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
            Suporte
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="/#duvidas" className="hover:text-foreground">
                Dúvidas frequentes
              </a>
            </li>
            <li>
              <Link href="/entrar" className="hover:text-foreground">
                Entrar
              </Link>
            </li>
            <li>
              <Link href="/registro" className="hover:text-foreground">
                Criar conta
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
            Legal
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#" className="hover:text-foreground">
                Termos de uso
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">
                Privacidade
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-border/60 pt-6 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Nomad. Todos os direitos reservados.
      </div>
    </footer>
  );
}
