"use client";

import Button from "@/components/ui/button";

export default function Error({ reset }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <span aria-hidden="true" className="text-4xl">
        🫠
      </span>
      <h1 className="text-xl font-extrabold text-ink">Algo deu errado</h1>
      <p className="text-sm text-muted">
        Não conseguimos carregar esta tela. Tente de novo — se continuar, avise o suporte.
      </p>
      <Button type="button" onClick={reset}>
        Tentar de novo
      </Button>
    </div>
  );
}
