-- Bimbel OS — Tighten Teacher access to read-only, per the Security
-- Foundation sprint spec. Additive migration: the policies below replace
-- (via DROP + CREATE) three specific policies from
-- 20260714150000_row_level_security.sql, which has already been applied to
-- the live database and must not be edited in place.

-- ============================================================================
-- roles — previously readable by any authenticated user. Now scoped to
-- Owner/Admin, or a role the caller actually holds via user_roles. The
-- self-relevance carve-out is required: get-current-user.ts resolves the
-- caller's own role name through a user_roles -> roles join, and that join
-- must keep working under RLS.
-- ============================================================================
drop policy if exists roles_select on public.roles;

create policy roles_select on public.roles
  for select using (
    public.is_owner_or_admin()
    or exists (
      select 1 from public.user_roles ur
      where ur.role_id = roles.id
        and ur.user_id = auth.uid()
        and ur.revoked_at is null
    )
  );

-- ============================================================================
-- attendance — Teacher loses INSERT/UPDATE. No attendance-taking feature
-- exists in the app yet, so this permission was unused surface. Revisit
-- when that feature is built (see docs/ROLE_PERMISSION_MATRIX.md, which
-- documents Teacher write access as the intended long-term design).
-- ============================================================================
drop policy if exists attendance_insert on public.attendance;
drop policy if exists attendance_update on public.attendance;

create policy attendance_insert on public.attendance
  for insert with check (public.is_owner_or_admin() and recorded_by = auth.uid());

create policy attendance_update on public.attendance
  for update using (public.is_owner_or_admin());

-- ============================================================================
-- class_sessions — Teacher loses UPDATE for the same reason. This also
-- fully resolves the column-level "status-only" restriction previously
-- flagged as unimplemented: moot now that Teacher has no UPDATE at all.
-- ============================================================================
drop policy if exists class_sessions_update on public.class_sessions;

create policy class_sessions_update on public.class_sessions
  for update using (public.is_owner_or_admin());
