"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function NewUserForm() {
  const router = useRouter();
  const toast = useToast();
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("colaborador");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState(null);

  useEffect(() => {
    async function loadRoles() {
      const response = await fetch("/api/v1/roles").catch(() => null);
      const body = response?.ok ? await response.json().catch(() => ({})) : {};

      // Uma lista ausente precisa virar mensagem, não estado inválido: guardar
      // `undefined` em `roles` faria o `roles.map()` da renderização seguinte
      // derrubar o formulário inteiro, e um <select> vazio e mudo não diria ao
      // admin o que houve.
      if (!body.roles?.length) {
        setError("Não foi possível carregar os papéis. Recarregue a página.");
        return;
      }

      setRoles(body.roles);
      setRole(body.roles.find((r) => r.key === "colaborador")?.key ?? body.roles[0].key);
    }
    loadRoles();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setInviteUrl(null);
    setIsSubmitting(true);

    let response;
    try {
      response = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
    } catch {
      setIsSubmitting(false);
      setError("Não foi possível falar com o servidor. Tente de novo.");
      return;
    }

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "Não foi possível cadastrar o colaborador.");
      return;
    }

    const body = await response.json();
    setInviteUrl(body.invite.url);
    setName("");
    setEmail("");
    toast.success("Colaborador cadastrado. Copie o link do convite.");
    router.refresh();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Link copiado.");
    } catch {
      // A área de transferência é negada em contexto não seguro e quando o
      // usuário recusa a permissão. Sem este aviso, o admin acha que copiou.
      toast.error("Não foi possível copiar. Selecione o link e copie à mão.");
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="text-lg font-bold text-ink">Novo colaborador</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-user-role" className="text-sm font-medium text-muted">
            Papel
          </label>
          <select
            id="new-user-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="min-h-11 rounded-md border border-line bg-surface px-3 py-2 text-ink"
          >
            {roles.map((currentRole) => (
              <option key={currentRole.key} value={currentRole.key}>
                {currentRole.name}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" isLoading={isSubmitting} loadingLabel="Cadastrando...">
          Cadastrar
        </Button>
      </form>

      {inviteUrl && (
        <div className="flex flex-col gap-2 rounded-md border border-line bg-surface-2 p-4">
          <p className="text-sm text-muted">Envie este link para o colaborador definir a senha:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              aria-label="Link do convite"
              className="min-h-11 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
            <Button type="button" variant="secondary" onClick={handleCopy}>
              Copiar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
