"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Logo from "@/components/ui/logo";

export default function AcceptInviteForm({ token, name, roleName }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  // Nenhuma mensagem daqui é de um campo só: a divergência entre as senhas é
  // sobre o par, e queda de rede não é sobre campo nenhum.
  const [pageError, setPageError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setPageError(null);
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
      setPageError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setPageError(body.message ?? "Não foi possível concluir o cadastro.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="text-center">
        <Logo className="mx-auto w-36" />
        <p className="mt-2 text-sm text-muted">Sistema de gestão</p>
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
        />

        <Alert>{pageError}</Alert>

        <Button type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Concluindo...">
          Concluir cadastro
        </Button>
      </Card>
    </div>
  );
}
