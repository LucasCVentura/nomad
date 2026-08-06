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

export default function EntrarPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next ?? "/app");
    router.refresh();
  }

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
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="voce@email.com" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/esqueci-senha"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <PasswordInput id="password" name="password" placeholder="••••••••" required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-rose text-rose-foreground hover:bg-rose/90"
        >
          {loading ? "Entrando..." : "Entrar"}
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthShell>
  );
}
