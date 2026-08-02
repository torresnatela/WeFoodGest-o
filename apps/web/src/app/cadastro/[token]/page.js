import user from "@/models/user";
import AcceptInviteForm from "./accept-invite-form";

export default async function CadastroPage({ params }) {
  const { token } = await params;

  const invitedUser = await user.findByValidInviteToken(token);

  if (!invitedUser) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          Este link de convite é inválido ou já expirou. Solicite um novo convite a um administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <AcceptInviteForm token={token} name={invitedUser.name} roleName={invitedUser.role.name} />
    </div>
  );
}
