"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegistroPage() {
  const router = useRouter();

  return (
    <AuthShell
      title="Criar conta"
      description="Leva menos de um minuto e é gratuito."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/entrar" className="text-rose hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/app");
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" type="text" placeholder="Seu nome" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@email.com" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" placeholder="••••••••" required />
        </div>
        <Button
          type="submit"
          className="w-full bg-rose text-rose-foreground hover:bg-rose/90"
        >
          Criar conta grátis
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthShell>
  );
}
