"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";

export default function AcceptInviteForm({ token, name, roleName }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let response;
    try {
      response = await fetch(`/api/v1/invites/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, password_confirmation: passwordConfirmation }),
      });
    } catch {
      setIsSubmitting(false);
      setError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "Não foi possível concluir o cadastro.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="text-center">
        <p className="font-display text-3xl font-extrabold text-brand">WeFood</p>
        <p className="text-sm text-muted">Sistema de gestão</p>
      </div>

      <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Boas-vindas, {name}</h1>
          <p className="text-sm text-muted">
            Seu convite é para o papel de {roleName}. Defina uma senha para concluir o cadastro.
          </p>
        </div>

        <Input
          label="Senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Input
          label="Confirmar senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          error={error}
        />

        <Button type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Concluindo...">
          Concluir cadastro
        </Button>
      </Card>
    </div>
  );
}
