-- Bimbel OS — Student Notes & derived status view
-- Supports the Student Management MVP design review: an append-only note
-- log per student, and a single derived-status computation so "Active" vs
-- "Inactive" is computed once, in the database, instead of re-derived
-- slightly differently by every screen that needs it.

-- ============================================================================
-- student_notes — deliberately append-only: no updated_at, no deleted_at,
-- and no UPDATE/DELETE policy for any role. A note is a fact about what was
-- said/decided at a point in time; correcting one means adding a new note,
-- not rewriting history (same principle already applied to attendance and
-- payments elsewhere in this schema).
-- ============================================================================
create table public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  body text not null,
  created_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint student_notes_body_not_blank check (length(trim(body)) > 0)
);

comment on table public.student_notes is
  'Append-only note log per student. No update/delete anywhere, by any role — a correction is a new note, not an edit to history.';

-- The only real query pattern: "all notes for this student's detail page."
create index student_notes_student_id_idx on public.student_notes (student_id);

alter table public.student_notes enable row level security;

-- Owner/Admin: full read, plus write. Teacher: read-only, scoped to
-- students with an active enrollment in a class they teach — same
-- relationship students_select already uses.
create policy student_notes_select on public.student_notes
  for select using (
    public.is_owner_or_admin()
    or exists (
      select 1 from public.enrollments e
      where e.student_id = student_notes.student_id
        and e.deleted_at is null
        and e.status = 'active'
        and public.is_teacher_of_class(e.class_id)
    )
  );

create policy student_notes_insert on public.student_notes
  for insert with check (public.is_owner_or_admin() and created_by = auth.uid());
-- No update or delete policy for any role — RLS defaults to deny, which is
-- exactly the append-only guarantee this table is meant to provide.

-- ============================================================================
-- students_with_status — a plain view (not materialized: data must be
-- current, and this is well within Postgres's range at MVP scale), computing
-- two values every Student Management screen needs and that don't map onto
-- any single column: derived status (a student has no status column of its
-- own — "active" means "has an active enrollment right now") and the
-- comma-joined names of their currently active classes (a student can have
-- more than one).
--
-- security_invoker = true is required here, not optional: without it, this
-- view would run with the privileges of whichever role created it, silently
-- bypassing the RLS that scopes a Teacher to their own students. With it,
-- every underlying table this view touches (students, enrollments, classes)
-- is evaluated under the *querying* user's own RLS policies, so a Teacher
-- querying this view sees exactly the same rows they'd see querying
-- `students` directly — nothing more.
-- ============================================================================
create view public.students_with_status
with (security_invoker = true)
as
select
  s.*,
  case
    when exists (
      select 1 from public.enrollments e
      where e.student_id = s.id
        and e.status = 'active'
        and e.deleted_at is null
    ) then 'active'
    else 'inactive'
  end as status,
  (
    select string_agg(c.name, ', ' order by c.name)
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = s.id
      and e.status = 'active'
      and e.deleted_at is null
      and c.deleted_at is null
  ) as active_class_names
from public.students s;

comment on view public.students_with_status is
  'students + derived status (active = has a current active enrollment) + comma-joined active class names. security_invoker=true: row visibility still comes entirely from students/enrollments/classes RLS, this view adds no access of its own.';

grant select on public.students_with_status to authenticated;
