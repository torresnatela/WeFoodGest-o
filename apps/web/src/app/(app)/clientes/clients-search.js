"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientsSearch({ defaultValue = "" }) {
  const router = useRouter();
  const [term, setTerm] = useState(defaultValue);
  // O último valor que a URL trouxe: serve para reagir só quando ela muda de
  // verdade, e não a cada renderização em que ela ainda não mudou.
  const [urlTerm, setUrlTerm] = useState(defaultValue);
  // O último valor que este componente pediu à URL.
  const [requestedTerm, setRequestedTerm] = useState(defaultValue);

  // Quando a URL muda por fora — o usuário clicou em "Clientes" na navegação,
  // por exemplo — esta rota não remonta o componente, então o estado local
  // sobreviveria com o termo antigo. Sem esta sincronização, o efeito abaixo
  // veria a divergência e navegaria de volta para a busca anterior, desfazendo
  // o clique do usuário 300ms depois, sem nenhum aviso.
  if (defaultValue !== urlTerm) {
    setUrlTerm(defaultValue);

    // Mas se a URL trouxe exatamente o que este componente pediu, a navegação
    // não veio de fora: é a nossa, chegando atrasada. Sobrescrever `term` aqui
    // apagaria os caracteres digitados enquanto ela estava a caminho.
    if (defaultValue !== requestedTerm) {
      setRequestedTerm(defaultValue);
      setTerm(defaultValue);
    }
  }

  useEffect(() => {
    if (term === defaultValue) {
      return;
    }

    const timer = setTimeout(() => {
      // Registrar o pedido antes de navegar é o que permite reconhecer esta
      // navegação quando ela voltar como `defaultValue`.
      setRequestedTerm(term);
      router.replace(term ? `/clientes?search=${encodeURIComponent(term)}` : "/clientes");
    }, 300);

    return () => clearTimeout(timer);
  }, [term, defaultValue, router]);

  return (
    <form className="flex gap-2" role="search">
      <input
        type="search"
        name="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Buscar por nome"
        aria-label="Buscar clientes por nome"
        className="min-h-11 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted"
      />
      <button
        type="submit"
        className="min-h-11 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-2"
      >
        Buscar
      </button>
    </form>
  );
}
