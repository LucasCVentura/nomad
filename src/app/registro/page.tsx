"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setLoading(false);

    if (error) {
      setError(
        error.message === "User already registered"
          ? "Esse e-mail já tem conta."
          : "Não foi possível criar a conta. Tente novamente."
      );
      return;
    }

    if (!data.session) {
      setConfirmSent(true);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  if (confirmSent) {
    return (
      <AuthShell
        title="Confirme seu e-mail"
        description="Falta só um passo."
        footer={
          <>
            Já confirmou?{" "}
            <Link href="/entrar" className="text-rose hover:underline">
              Entrar
            </Link>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Enviamos um link de confirmação pro seu e-mail. Clique nele pra
          ativar sua conta antes de entrar.
        </p>
      </AuthShell>
    );
  }

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
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" type="text" placeholder="Seu nome" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="voce@email.com" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-rose text-rose-foreground hover:bg-rose/90"
        >
          {loading ? "Criando..." : "Criar conta grátis"}
          <ArrowRight className="size-4" />
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Ao criar sua conta, você concorda com os{" "}
          <Link href="/termos" className="text-rose hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="text-rose hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
