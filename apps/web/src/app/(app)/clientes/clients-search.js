"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientsSearch({ defaultValue = "" }) {
  const router = useRouter();
  const [term, setTerm] = useState(defaultValue);

  useEffect(() => {
    if (term === defaultValue) {
      return;
    }

    const timer = setTimeout(() => {
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
