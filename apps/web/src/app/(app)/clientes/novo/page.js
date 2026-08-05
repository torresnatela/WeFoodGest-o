import requireAuthenticatedUser from "../../../require-auth";
import NewClientPageForm from "./new-client-page-form";

export default async function NovoClientePage() {
  await requireAuthenticatedUser();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Novo cliente</h1>
      <NewClientPageForm />
    </div>
  );
}
