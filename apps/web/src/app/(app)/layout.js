import requireAuthenticatedUser from "../require-auth";
import authorization from "@/models/authorization";
import AppShell from "@/components/app-shell";

const MANAGE_USERS_FEATURE = "usuarios.gerenciar";
const VIEW_DASHBOARD_FEATURE = "dashboard.visualizar";

export default async function AppLayout({ children }) {
  const authenticatedUser = await requireAuthenticatedUser();

  return (
    <AppShell
      user={authenticatedUser}
      canManageUsers={authorization.userCan(authenticatedUser, MANAGE_USERS_FEATURE)}
      canViewDashboard={authorization.userCan(authenticatedUser, VIEW_DASHBOARD_FEATURE)}
    >
      {children}
    </AppShell>
  );
}
