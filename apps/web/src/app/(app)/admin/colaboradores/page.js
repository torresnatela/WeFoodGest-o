import { notFound } from "next/navigation";

import requireAuthenticatedUser from "../../../require-auth";
import authorization from "@/models/authorization";
import user from "@/models/user";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import NewUserForm from "./new-user-form";

const MANAGE_USERS_FEATURE = "usuarios.gerenciar";

const STATUS_LABELS = {
  active: "Ativo",
  pending: "Pendente",
};

export default async function ColaboradoresPage() {
  const authenticatedUser = await requireAuthenticatedUser();

  if (!authorization.userCan(authenticatedUser, MANAGE_USERS_FEATURE)) {
    notFound();
  }

  const users = await user.findAll();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Colaboradores</h1>

      <NewUserForm />

      <div className="flex flex-col gap-2">
        {users.map((listedUser) => (
          <Card key={listedUser.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-ink">{listedUser.name}</p>
              <p className="text-sm text-muted">{listedUser.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{listedUser.role.name}</Badge>
              <Badge tone={listedUser.status === "active" ? "success" : "brand"}>
                {STATUS_LABELS[listedUser.status] ?? listedUser.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
