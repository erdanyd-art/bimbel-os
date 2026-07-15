import { LogOut } from "lucide-react";

import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { logout } from "@/features/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";

// Server Component: getCurrentUser() is already request-deduped via React's
// cache() (see features/auth/queries/get-current-user.ts), so calling it
// again here — after (protected)/layout.tsx already called it to guard the
// route — costs nothing extra. User identity + sign-out belong in the
// persistent shell, not duplicated on every page that needs them.
export async function Topbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-border bg-background flex h-14 shrink-0 items-center justify-end gap-4 border-b px-4 md:px-6">
      {user ? (
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-foreground text-sm font-medium">{user.email}</p>
            <p className="text-tertiary text-xs capitalize">{user.roles.join(", ")}</p>
          </div>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Log out">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      ) : null}
    </header>
  );
}
