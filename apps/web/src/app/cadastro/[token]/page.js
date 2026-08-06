import user from "@/models/user";
import Card from "@/components/ui/card";
import AcceptInviteForm from "./accept-invite-form";

export default async function CadastroPage({ params }) {
  const { token } = await params;

  const invitedUser = await user.findByValidInviteToken(token);

  if (!invitedUser) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="flex max-w-sm flex-col gap-2 p-6 text-center">
          <span aria-hidden="true" className="text-3xl">
            ⏳
          </span>
          <h1 className="text-lg font-extrabold text-ink">Convite inválido ou expirado</h1>
          <p className="text-sm text-muted">
            Solicite um novo convite a um administrador para concluir seu cadastro.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <AcceptInviteForm token={token} name={invitedUser.name} roleName={invitedUser.role.name} />
    </div>
  );
}
