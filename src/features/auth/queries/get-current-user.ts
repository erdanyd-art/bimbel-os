import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { AuthUser, Role } from "@/features/auth/types";

type UserRoleGrant = {
  roles: { name: string } | null;
};

function toRole(value: unknown): Role | null {
  return value === "owner" || value === "admin" || value === "teacher" ? value : null;
}

/**
 * Re-validates the session against Supabase (not a decoded cookie) and resolves
 * the caller's roles from user_roles/roles — the authoritative source of role
 * truth. auth.users.app_metadata is intentionally never read: there must be
 * exactly one place a role lives, per docs/ROLE_PERMISSION_MATRIX.md.
 * A user with no active (non-revoked) role grant is treated as unauthenticated.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  const { data: grants } = (await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id)
    .is("revoked_at", null)) as { data: UserRoleGrant[] | null };

  const roles = Array.from(
    new Set(
      (grants ?? [])
        .map((grant) => toRole(grant.roles?.name))
        .filter((role): role is Role => role !== null),
    ),
  );

  if (roles.length === 0) return null;

  return { id: user.id, email: user.email, roles };
});
