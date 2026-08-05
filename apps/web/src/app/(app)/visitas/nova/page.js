import requireAuthenticatedUser from "../../../require-auth";
import client from "@/models/client";
import RegisterVisitFlow from "./register-visit-flow";

export default async function NovaVisitaPage({ searchParams }) {
  await requireAuthenticatedUser();

  const { clientId } = await searchParams;
  const initialClient = clientId ? await client.findById(clientId) : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-8">
      <RegisterVisitFlow initialClient={initialClient} />
    </div>
  );
}
