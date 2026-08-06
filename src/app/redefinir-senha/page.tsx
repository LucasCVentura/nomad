"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "expired";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // O link do e-mail chega com ?code=... na URL; o próprio client já troca
    // esse código pela sessão de recuperação ao ser criado — este evento é
    // o sinal de que ela ficou pronta. Um link expirado ou já usado nunca
    // dispara PASSWORD_RECOVERY, então o timeout abaixo cobre esse caso.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready");
      }
    });

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "expired" : current));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password"));
    const confirm = String(formData.get("confirm"));

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não são iguais.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Não consegui trocar a senha. Tente pedir o link de novo.");
      setSaving(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  if (status === "checking") {
    return (
      <AuthShell
        title="Confirmando o link..."
        description="Só um instante."
        footer={null}
      >
        <div className="flex justify-center py-4">
          <Loader2 className="size-6 animate-spin text-rose" />
        </div>
      </AuthShell>
    );
  }

  if (status === "expired") {
    return (
      <AuthShell
        title="Link expirado"
        description="Esse link de recuperação não é mais válido — cada um vale só uma vez, e por pouco tempo."
        footer={
          <Link href="/entrar" className="text-rose hover:underline">
            Voltar pro login
          </Link>
        }
      >
        <Button
          className="w-full bg-rose text-rose-foreground hover:bg-rose/90"
          render={<Link href="/esqueci-senha" />}
          nativeButton={false}
        >
          Pedir um link novo
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crie uma senha nova"
      description="Escolha uma senha com pelo menos 6 caracteres."
      footer={null}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <PasswordInput id="password" name="password" placeholder="••••••••" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirme a senha</Label>
          <PasswordInput id="confirm" name="confirm" placeholder="••••••••" required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-rose text-rose-foreground hover:bg-rose/90"
        >
          {saving ? "Salvando..." : "Salvar nova senha"}
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthShell>
  );
}
