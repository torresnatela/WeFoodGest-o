"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // O servidor não diz qual campo está errado — nem poderia, para não revelar
  // se o email existe. Marcar a senha como inválida seria um palpite, então
  // toda mensagem daqui é de página, não de campo.
  const [pageError, setPageError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setPageError(null);
    setIsSubmitting(true);

    let response;
    try {
      response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      setIsSubmitting(false);
      setPageError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setPageError(body.message ?? "Não foi possível entrar.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <p className="font-display text-3xl font-extrabold text-brand">WeFood</p>
          <p className="text-sm text-muted">Sistema de gestão</p>
        </div>

        <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Input
            label="Senha"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Alert>{pageError}</Alert>

          <Button type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Entrando...">
            Entrar
          </Button>
        </Card>
      </div>
    </div>
  );
}
