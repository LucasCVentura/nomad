"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function EsqueciSenhaPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const email = String(new FormData(e.currentTarget).get("email"));
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setLoading(false);
    // Mostra a mesma confirmação mesmo se o e-mail não existir na base — não
    // dá pra revelar isso pra quem está preenchendo o formulário. Só uma
    // falha de verdade (fora do ar, por exemplo) vira mensagem de erro.
    if (error && !error.message.toLowerCase().includes("rate limit")) {
      setError("Não consegui enviar agora. Tente de novo em instantes.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="Confira seu e-mail"
        description="Se esse e-mail estiver cadastrado, você vai receber um link pra criar uma senha nova em alguns minutos."
        footer={
          <Link href="/entrar" className="text-rose hover:underline">
            Voltar pro login
          </Link>
        }
      >
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
          <Mail className="size-5 shrink-0 text-gold" />
          Não esqueça de olhar a caixa de spam — e-mails automáticos às vezes
          param lá.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Esqueceu a senha?"
      description="Digite seu e-mail e mandamos um link pra você criar uma senha nova."
      footer={
        <>
          Lembrou a senha?{" "}
          <Link href="/entrar" className="text-rose hover:underline">
            Voltar pro login
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="voce@email.com" required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-rose text-rose-foreground hover:bg-rose/90"
        >
          {loading ? "Enviando..." : "Enviar link"}
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthShell>
  );
}
