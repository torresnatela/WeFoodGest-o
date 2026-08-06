import Link from "next/link";

import Button from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span aria-hidden="true" className="text-4xl">
        🍨
      </span>
      <h1 className="text-xl font-extrabold text-ink">Página não encontrada</h1>
      <p className="text-sm text-muted">O endereço acessado não existe ou foi removido.</p>
      <Button as={Link} href="/">
        Voltar ao início
      </Button>
    </div>
  );
}
