-- Bimbel OS — Row Level Security
-- Closes the CRITICAL production-blocker finding: every table was previously
-- reachable by anyone holding the anon key, with zero enforcement of the
-- Owner/Admin/Teacher scoping documented in docs/ROLE_PERMISSION_MATRIX.md.
--
-- Nothing here is ever hard-deleted (existing schema policy) except
-- teacher_subjects, the one table with no deleted_at column — so DELETE
-- policies only exist where a real DELETE is expected to happen.

-- ============================================================================
-- Helper functions (SECURITY DEFINER) — the single chokepoint every
-- Teacher-scoped policy below calls, instead of re-deriving the same
-- teachers -> classes join in a dozen places. SECURITY DEFINER + a pinned
-- search_path also avoids the recursion trap: these functions read
-- user_roles/roles/teachers directly, bypassing the very RLS policies being
-- defined on those tables, so checking "am I an Admin" never re-triggers
-- RLS evaluation on user_roles.
-- ============================================================================

create or replace function public.has_role(p_role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and ur.revoked_at is null
      and r.name = p_role_name
  );
$$;

comment on function public.has_role(text) is
  'True if the current session holds an active (non-revoked) grant of the given role. SECURITY DEFINER so it never recurses into its own RLS policies.';

create or replace function public.is_owner_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('owner') or public.has_role('admin');
$$;

create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.teachers
  where user_id = auth.uid() and deleted_at is null;
$$;

comment on function public.current_teacher_id() is
  'The teachers.id row for the current session, or null if the session is not an active teacher.';

create or replace function public.is_teacher_of_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id
      and c.teacher_id = public.current_teacher_id()
  );
$$;

comment on function public.is_teacher_of_class(uuid) is
  'The single scoping chokepoint for Teacher access: every Teacher-scoped policy in this schema resolves through this one relationship, per docs/ROLE_PERMISSION_MATRIX.md.';

-- ============================================================================
-- 1. users
-- ============================================================================
alter table public.users enable row level security;

create policy users_select on public.users
  for select using (id = auth.uid() or public.is_owner_or_admin());

create policy users_update on public.users
  for update using (id = auth.uid() or public.is_owner_or_admin())
  with check (id = auth.uid() or public.is_owner_or_admin());
-- No insert policy: rows are only ever created by the SECURITY DEFINER
-- auth.users sync trigger (migration 20260714130000), which runs as the
-- migration role and bypasses RLS. No delete policy: deactivation is a
-- deleted_at update, already covered by users_update.

-- ============================================================================
-- 2. roles — low-stakes reference data
-- ============================================================================
alter table public.roles enable row level security;

create policy roles_select on public.roles
  for select using (auth.uid() is not null);

create policy roles_insert on public.roles
  for insert with check (public.has_role('owner'));

create policy roles_update on public.roles
  for update using (public.has_role('owner'));

-- ============================================================================
-- 3. user_roles — highest-priority policy in this migration: the
--    privilege-escalation surface identified in the production review.
--    An Admin may only grant/revoke the 'teacher' role; only an Owner may
--    grant/revoke 'owner' or 'admin'. A Teacher can do neither.
-- ============================================================================
alter table public.user_roles enable row level security;

create policy user_roles_select on public.user_roles
  for select using (user_id = auth.uid() or public.is_owner_or_admin());

create policy user_roles_insert on public.user_roles
  for insert with check (
    public.has_role('owner')
    or (
      public.has_role('admin')
      and role_id = (select id from public.roles where name = 'teacher')
    )
  );

create policy user_roles_update on public.user_roles
  for update using (
    public.has_role('owner')
    or (
      public.has_role('admin')
      and role_id = (select id from public.roles where name = 'teacher')
    )
  );

-- ============================================================================
-- 4. subjects
-- ============================================================================
alter table public.subjects enable row level security;

create policy subjects_select on public.subjects
  for select using (auth.uid() is not null);

create policy subjects_insert on public.subjects
  for insert with check (public.is_owner_or_admin());

create policy subjects_update on public.subjects
  for update using (public.is_owner_or_admin());

-- ============================================================================
-- 5. teachers
-- ============================================================================
alter table public.teachers enable row level security;

create policy teachers_select on public.teachers
  for select using (user_id = auth.uid() or public.is_owner_or_admin());

create policy teachers_insert on public.teachers
  for insert with check (public.is_owner_or_admin());

create policy teachers_update on public.teachers
  for update using (user_id = auth.uid() or public.is_owner_or_admin())
  with check (user_id = auth.uid() or public.is_owner_or_admin());

-- ============================================================================
-- 6. teacher_subjects — the one table in this schema with no deleted_at,
--    so unassigning a qualification is a real DELETE, not a soft one.
-- ============================================================================
alter table public.teacher_subjects enable row level security;

create policy teacher_subjects_select on public.teacher_subjects
  for select using (
    public.is_owner_or_admin() or teacher_id = public.current_teacher_id()
  );

create policy teacher_subjects_insert on public.teacher_subjects
  for insert with check (public.is_owner_or_admin());

create policy teacher_subjects_delete on public.teacher_subjects
  for delete using (public.is_owner_or_admin());

-- ============================================================================
-- 7. students — PII, minors' data. Teacher access is read-only and scoped
--    to students with an active enrollment in a class they teach.
-- ============================================================================
alter table public.students enable row level security;

create policy students_select on public.students
  for select using (
    public.is_owner_or_admin()
    or exists (
      select 1 from public.enrollments e
      where e.student_id = students.id
        and e.deleted_at is null
        and e.status = 'active'
        and public.is_teacher_of_class(e.class_id)
    )
  );

create policy students_insert on public.students
  for insert with check (public.is_owner_or_admin() and created_by = auth.uid());

create policy students_update on public.students
  for update using (public.is_owner_or_admin());

-- ============================================================================
-- 8. classes
-- ============================================================================
alter table public.classes enable row level security;

create policy classes_select on public.classes
  for select using (
    public.is_owner_or_admin() or teacher_id = public.current_teacher_id()
  );

create policy classes_insert on public.classes
  for insert with check (public.is_owner_or_admin() and created_by = auth.uid());

create policy classes_update on public.classes
  for update using (public.is_owner_or_admin());

-- ============================================================================
-- 9. class_schedules
-- ============================================================================
alter table public.class_schedules enable row level security;

create policy class_schedules_select on public.class_schedules
  for select using (
    public.is_owner_or_admin() or public.is_teacher_of_class(class_id)
  );

create policy class_schedules_insert on public.class_schedules
  for insert with check (public.is_owner_or_admin());

create policy class_schedules_update on public.class_schedules
  for update using (public.is_owner_or_admin());

-- ============================================================================
-- 10. class_sessions — Teacher gets full row-scoped UPDATE here, not just
--     `status`. docs/ROLE_PERMISSION_MATRIX.md says Teacher should only be
--     able to change status (mark held/cancelled), not reschedule; enforcing
--     that precisely needs an OLD-vs-NEW trigger (RLS alone can't do
--     column-level restriction split by application role, since Owner/Admin
--     and Teacher are the same Postgres role to RLS). Deliberately not
--     built in this pass — the residual risk is a teacher rescheduling a
--     session for a class they already legitimately teach, not a privilege
--     escalation or data leak. Flagging, not fixing, per MVP scope.
-- ============================================================================
alter table public.class_sessions enable row level security;

create policy class_sessions_select on public.class_sessions
  for select using (
    public.is_owner_or_admin() or public.is_teacher_of_class(class_id)
  );

create policy class_sessions_insert on public.class_sessions
  for insert with check (public.is_owner_or_admin() and created_by = auth.uid());

create policy class_sessions_update on public.class_sessions
  for update using (
    public.is_owner_or_admin() or public.is_teacher_of_class(class_id)
  );

-- ============================================================================
-- 11. enrollments
-- ============================================================================
alter table public.enrollments enable row level security;

create policy enrollments_select on public.enrollments
  for select using (
    public.is_owner_or_admin() or public.is_teacher_of_class(class_id)
  );

create policy enrollments_insert on public.enrollments
  for insert with check (public.is_owner_or_admin() and created_by = auth.uid());

create policy enrollments_update on public.enrollments
  for update using (public.is_owner_or_admin());

-- ============================================================================
-- 12. attendance — Owner/Admin read + correct (oversight); Teacher gets
--     create/read/update scoped to sessions of classes they teach — scoped
--     via class_session_id's class, not via recorded_by, so a teacher can
--     read/correct attendance a substitute recorded for their class too.
-- ============================================================================
alter table public.attendance enable row level security;

create policy attendance_select on public.attendance
  for select using (
    public.is_owner_or_admin()
    or exists (
      select 1 from public.class_sessions cs
      where cs.id = attendance.class_session_id
        and public.is_teacher_of_class(cs.class_id)
    )
  );

create policy attendance_insert on public.attendance
  for insert with check (
    (
      public.is_owner_or_admin()
      or exists (
        select 1 from public.class_sessions cs
        where cs.id = class_session_id
          and public.is_teacher_of_class(cs.class_id)
      )
    )
    and recorded_by = auth.uid()
  );

create policy attendance_update on public.attendance
  for update using (
    public.is_owner_or_admin()
    or exists (
      select 1 from public.class_sessions cs
      where cs.id = attendance.class_session_id
        and public.is_teacher_of_class(cs.class_id)
    )
  );

-- ============================================================================
-- 13. payments — financial data. Teacher gets no access at all: no policy
--     grants Teacher anything here, and RLS defaults to deny.
-- ============================================================================
alter table public.payments enable row level security;

create policy payments_select on public.payments
  for select using (public.is_owner_or_admin());

create policy payments_insert on public.payments
  for insert with check (public.is_owner_or_admin() and recorded_by = auth.uid());

create policy payments_update on public.payments
  for update using (public.is_owner_or_admin());
