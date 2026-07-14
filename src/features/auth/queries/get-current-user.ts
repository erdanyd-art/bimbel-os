import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { AuthUser, Role } from "@/features/auth/types";

function toRole(value: unknown): Role | null {
  return value === "owner" || value === "admin" || value === "teacher" ? value : null;
}

/**
 * Re-validates the session against Supabase (not a decoded cookie) and resolves
 * the caller's role from auth.users.app_metadata — the only place a role can be
 * written from is the service role key, so a user can never self-assign one.
 * A user with no valid role assigned is treated as unauthenticated.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role = toRole(user.app_metadata?.role);
  if (!role || !user.email) return null;

  return { id: user.id, email: user.email, role };
});
