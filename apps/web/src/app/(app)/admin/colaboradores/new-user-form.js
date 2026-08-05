"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUserForm() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("colaborador");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadRoles() {
      const response = await fetch("/api/v1/roles");
      if (!response.ok) {
        return;
      }
      const body = await response.json();
      setRoles(body.roles);
      if (body.roles.length > 0) {
        setRole(body.roles.find((r) => r.key === "colaborador")?.key ?? body.roles[0].key);
      }
    }
    loadRoles();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setInviteUrl(null);
    setCopied(false);
    setIsSubmitting(true);

    const response = await fetch("/api/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json();
      setError(body.message ?? "Não foi possível cadastrar o colaborador.");
      return;
    }

    const body = await response.json();
    setInviteUrl(body.invite.url);
    setName("");
    setEmail("");
    router.refresh();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Novo colaborador</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          Nome
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          Role
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-md border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
          >
            {roles.map((currentRole) => (
              <option key={currentRole.key} value={currentRole.key}>
                {currentRole.name}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {isSubmitting ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      {inviteUrl && (
        <div className="flex flex-col gap-2 rounded-md border border-black/[.08] p-4 dark:border-white/[.145]">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Envie este link para o colaborador definir a senha:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 rounded-md border border-black/[.08] px-3 py-2 text-sm text-black dark:border-white/[.145] dark:text-zinc-50"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
