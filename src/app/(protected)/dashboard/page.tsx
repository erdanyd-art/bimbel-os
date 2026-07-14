import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { logout } from "@/features/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
        <p className="text-muted-foreground text-sm">
          {user.roles.length > 1 ? "Roles" : "Role"}:{" "}
          <span className="text-foreground font-medium capitalize">{user.roles.join(", ")}</span>
        </p>
      </div>

      <form action={logout}>
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>

      <p className="text-muted-foreground max-w-sm text-center text-xs">
        Temporary dashboard — no business features have been built yet.
      </p>
    </div>
  );
}
