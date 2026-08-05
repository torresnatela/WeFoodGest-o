"use client";

import { useRouter } from "next/navigation";

import ClientForm from "@/components/client-form";

export default function NewClientPageForm() {
  const router = useRouter();

  function handleCreated(createdClient) {
    router.push(`/clientes/${createdClient.id}`);
    router.refresh();
  }

  return <ClientForm onCreated={handleCreated} submitLabel="Cadastrar cliente" />;
}
