"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function formatCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function AccountSettingsForm({
  initialName,
  cpf,
}: {
  initialName: string;
  cpf: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameError(null);
    setNameSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Atualiza os dois: profiles.name (o que o resto do app lê) e o
    // user_metadata do auth (é de onde o avatar do topbar tira as iniciais) —
    // sem isso os dois ficam dessincronizados até o próximo login.
    const [{ error: profileError }, { error: authError }] = await Promise.all([
      supabase.from("profiles").update({ name }).eq("id", user?.id ?? ""),
      supabase.auth.updateUser({ data: { name } }),
    ]);

    setSavingName(false);
    if (profileError || authError) {
      setNameError("Não consegui salvar o nome. Tente de novo.");
      return;
    }
    setNameSaved(true);
    router.refresh();
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (password.length < 6) {
      setPasswordError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setPasswordError("As senhas não são iguais.");
      return;
    }

    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    if (error) {
      setPasswordError("Não consegui trocar a senha. Tente de novo.");
      return;
    }
    setPassword("");
    setConfirm("");
    setPasswordSaved(true);
  }

  return (
    <div className="mt-4 space-y-4">
      <form
        onSubmit={handleSaveName}
        className="rounded-2xl border border-border/60 bg-card p-5"
      >
        <p className="font-heading text-base text-foreground">Seu nome</p>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameSaved(false);
            }}
            required
          />
        </div>
        {nameError && <p className="mt-2 text-xs text-destructive">{nameError}</p>}
        {nameSaved && <p className="mt-2 text-xs text-rose">Nome atualizado.</p>}
        <Button type="submit" size="sm" className="mt-3" disabled={savingName || !name.trim()}>
          {savingName ? "Salvando..." : "Salvar nome"}
        </Button>
      </form>

      <form
        onSubmit={handleSavePassword}
        className="rounded-2xl border border-border/60 bg-card p-5"
      >
        <p className="font-heading text-base text-foreground">Trocar senha</p>
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Nova senha</Label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordSaved(false);
              }}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirme a senha</Label>
            <PasswordInput
              id="confirm-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setPasswordSaved(false);
              }}
              placeholder="••••••••"
            />
          </div>
        </div>
        {passwordError && <p className="mt-2 text-xs text-destructive">{passwordError}</p>}
        {passwordSaved && <p className="mt-2 text-xs text-rose">Senha atualizada.</p>}
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="mt-3"
          disabled={savingPassword || !password}
        >
          {savingPassword ? "Salvando..." : "Trocar senha"}
        </Button>
      </form>

      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <p className="font-heading text-base text-foreground">CPF</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {cpf ? formatCpf(cpf) : "Não informado ainda — é pedido na primeira compra."}
        </p>
        {cpf && (
          <p className="mt-2 text-xs text-muted-foreground">
            Usado nas suas cobranças. Se precisar corrigir, fale com a Dra.
            Nathalia pelo chat de um dos seus conteúdos.
          </p>
        )}
      </div>
    </div>
  );
}
