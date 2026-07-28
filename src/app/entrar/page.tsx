"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EntrarPage() {
  const router = useRouter();

  return (
    <AuthShell
      title="Entrar"
      description="Acesse sua área de estudos e a comunidade."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/registro" className="text-rose hover:underline">
            Criar conta grátis
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
          Entrar
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthShell>
  );
}
