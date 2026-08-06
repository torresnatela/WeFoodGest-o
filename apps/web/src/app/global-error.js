"use client";

// Este arquivo substitui o layout raiz quando dispara, então precisa trazer o
// próprio `<html>`, o próprio `<body>` e os próprios estilos — nada do layout
// raiz chega até aqui. É a única rede de segurança de `/login`, `/avaliar` e
// `/cadastro/[token]`, que estão fora do grupo `(app)` e não têm `error.js`.
import "./globals.css";
import Button from "@/components/ui/button";

export default function GlobalError({ reset }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="flex min-h-full flex-col bg-bg text-ink">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
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
      </body>
    </html>
  );
}
