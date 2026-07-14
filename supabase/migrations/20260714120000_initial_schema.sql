-- Bimbel OS — Initial MVP schema
-- Corresponds to the ER Diagram approved in docs/ (13 tables).
-- Deliberately excludes: Row Level Security policies, seed data.
-- FK deletion policy: RESTRICT by default everywhere; the only exceptions
-- (CASCADE / SET NULL) are called out per-table below with a reason.

create extension if not exists pgcrypto;

-- Shared trigger: every table below has updated_at maintained by the
-- database itself, not trusted to application code.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. users — app-facing mirror of a Supabase Auth identity (staff only)
-- ============================================================================
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is
  'App-facing profile mirroring a Supabase Auth identity. Owner/Admin/Teacher only — Students/Parents never get a row here (docs/AUTHENTICATION.md).';
comment on column public.users.id is
  'Not independently generated — always equal to the corresponding auth.users.id.';
comment on column public.users.deleted_at is
  'Soft-delete marker: staff deactivation. Set by an Owner action; row is never hard-deleted so audit FKs (created_by, recorded_by) never dangle.';

create trigger set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 2. roles — Owner / Admin / Teacher, stored as rows (not an ENUM) so a new
--    role can be added later without a schema migration
-- ============================================================================
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_name_not_blank check (length(trim(name)) > 0)
);

comment on table public.roles is
  'The set of roles a user can hold. Deliberately not CHECK-constrained to a fixed value list — that would defeat the reason this is a table instead of an ENUM.';

create trigger set_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 3. user_roles — many-to-many; authoritative source of role truth
--    (supersedes Sprint 3's single-value auth.users.app_metadata.role —
--    see docs/ROLE_PERMISSION_MATRIX.md and follow-up noted in the PR)
-- ============================================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  role_id uuid not null references public.roles (id) on delete restrict,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_roles is
  'Grants a role to a user. Supports multiple simultaneous roles per Person, per docs/DOMAIN_MODEL.md ("an Owner who also teaches").';
comment on column public.user_roles.revoked_at is
  'Soft-delete for this table: revoking a role sets this instead of deleting the row, preserving grant/revoke history.';

-- Partial unique: a user can hold the same role only once *at a time*, but
-- can be re-granted it later (old row stays as history with revoked_at set).
create unique index user_roles_active_grant_uidx
  on public.user_roles (user_id, role_id)
  where revoked_at is null;

-- Not covered by the composite unique index above (role_id isn't the
-- leading column) — needed for "list everyone holding role X" queries.
create index user_roles_role_id_idx
  on public.user_roles (role_id);

create trigger set_updated_at
  before update on public.user_roles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. subjects — catalog of subjects offered by the Center
-- ============================================================================
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subjects is
  'Catalog of subjects (e.g. Matematika, Bahasa Inggris). Referenced by classes and teacher_subjects.';

create trigger set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 5. teachers — extends a user with teaching-specific data
-- ============================================================================
create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete restrict,
  bio text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.teachers is
  'Teaching-specific extension of a users row. The unique constraint on user_id enforces at most one teacher profile per identity.';

create trigger set_updated_at
  before update on public.teachers
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 6. teacher_subjects — many-to-many; which subjects a teacher is qualified in
-- ============================================================================
create table public.teacher_subjects (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_subjects_unique unique (teacher_id, subject_id)
);

comment on table public.teacher_subjects is
  'Pure capability tag — a teacher qualified in a subject. No independent history value, so (unlike most FKs in this schema) this table uses CASCADE, not RESTRICT.';

create index teacher_subjects_subject_id_idx
  on public.teacher_subjects (subject_id);

create trigger set_updated_at
  before update on public.teacher_subjects
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 7. students — the Student entity. Parent/Guardian contact is embedded
--    (no separate parents table in this MVP's 13-entity scope — known
--    duplication trade-off across siblings, documented and accepted).
-- ============================================================================
create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  grade_level text,
  date_of_birth date,
  parent_name text not null,
  parent_phone text not null,
  parent_email text,
  created_by uuid not null references public.users (id) on delete restrict,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_dob_not_future check (date_of_birth is null or date_of_birth <= current_date)
);

comment on table public.students is
  'The Student entity. parent_name/parent_phone/parent_email are duplicated across siblings by design — no separate parents table in this MVP scope.';

create trigger set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 8. classes — catalog offering (subject + level + capacity + assigned teacher)
-- ============================================================================
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  level text,
  teacher_id uuid references public.teachers (id) on delete set null,
  capacity int not null,
  created_by uuid not null references public.users (id) on delete restrict,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_capacity_positive check (capacity > 0)
);

comment on table public.classes is
  'A class offering. teacher_id is nullable — a class can exist unassigned or survive its teacher being removed.';

create index classes_subject_id_idx on public.classes (subject_id);
create index classes_teacher_id_idx on public.classes (teacher_id);
create index classes_active_idx on public.classes (id) where deleted_at is null;

create trigger set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 9. class_schedules — structured recurring weekly meeting pattern
-- ============================================================================
create table public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete restrict,
  day_of_week smallint not null,
  start_time time not null,
  end_time time not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_schedules_day_of_week_range check (day_of_week between 0 and 6),
  constraint class_schedules_time_order check (end_time > start_time)
);

comment on table public.class_schedules is
  'Recurring weekly slot(s) for a class (a class can meet more than once a week). Replaces the old free-text classes.schedule_note.';
comment on column public.class_schedules.day_of_week is
  'Postgres EXTRACT(DOW) convention: 0 = Sunday, 6 = Saturday.';

create unique index class_schedules_active_slot_uidx
  on public.class_schedules (class_id, day_of_week, start_time)
  where deleted_at is null;

create trigger set_updated_at
  before update on public.class_schedules
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 10. class_sessions — a concrete occurrence of a class on a specific date
-- ============================================================================
create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete restrict,
  class_schedule_id uuid references public.class_schedules (id) on delete set null,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'scheduled',
  created_by uuid not null references public.users (id) on delete restrict,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_sessions_time_order check (end_time > start_time),
  constraint class_sessions_status_valid check (status in ('scheduled', 'held', 'cancelled'))
);

comment on table public.class_sessions is
  'One real occurrence of a class. class_schedule_id is nullable: a session following the regular weekly pattern links to it; an ad hoc/makeup session does not.';

create unique index class_sessions_active_per_day_uidx
  on public.class_sessions (class_id, session_date)
  where deleted_at is null;
create index class_sessions_session_date_idx on public.class_sessions (session_date);
create index class_sessions_class_schedule_id_idx on public.class_sessions (class_schedule_id);

create trigger set_updated_at
  before update on public.class_sessions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 11. enrollments — merges Domain Model's Enrollment + Class Assignment:
--     a student's membership + agreed fee for a class over a period
-- ============================================================================
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  class_id uuid not null references public.classes (id) on delete restrict,
  fee numeric(12, 2) not null,
  start_date date not null,
  end_date date,
  status text not null default 'active',
  created_by uuid not null references public.users (id) on delete restrict,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollments_fee_non_negative check (fee >= 0),
  constraint enrollments_date_order check (end_date is null or end_date >= start_date),
  constraint enrollments_status_valid check (status in ('active', 'completed', 'transferred', 'withdrawn'))
);

comment on table public.enrollments is
  'fee is fixed at the time this row is created and is never updated in place — a fee or class change closes this row (end_date + status) and opens a new one, preserving history.';

-- Prevents double-enrolling the same student in the same class at once.
create unique index enrollments_one_active_per_class_uidx
  on public.enrollments (student_id, class_id)
  where status = 'active' and deleted_at is null;

create index enrollments_student_id_idx on public.enrollments (student_id);
create index enrollments_class_id_idx on public.enrollments (class_id);
-- Serves the "active student count" dashboard query (docs/PRODUCT_REQUIREMENTS.md Goals).
create index enrollments_active_idx on public.enrollments (id)
  where status = 'active' and deleted_at is null;

create trigger set_updated_at
  before update on public.enrollments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 12. attendance — presence record for a student at a specific class session
-- ============================================================================
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete restrict,
  class_session_id uuid not null references public.class_sessions (id) on delete restrict,
  status text not null,
  recorded_by uuid not null references public.users (id) on delete restrict,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_status_valid check (status in ('present', 'absent', 'late'))
);

comment on table public.attendance is
  'One record per (enrollment, class_session). NOT enforced here: enrollment.class_id must equal class_session.class_id — cross-table, needs a trigger (not included in this migration).';

create unique index attendance_one_per_session_uidx
  on public.attendance (enrollment_id, class_session_id)
  where deleted_at is null;
-- Not covered by the composite unique above (class_session_id isn't the
-- leading column) — needed for "who attended this session" roster queries.
create index attendance_class_session_id_idx on public.attendance (class_session_id);

create trigger set_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 13. payments — combined obligation + settlement per enrollment per billing
--     period (Domain Model's Invoice and payment confirmation merged — see
--     the invoice-vs-payment_transaction analysis in the PR discussion)
-- ============================================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete restrict,
  billing_period_start date not null,
  billing_period_end date not null,
  amount_due numeric(12, 2) not null,
  amount_paid numeric(12, 2) not null default 0,
  status text not null default 'pending',
  paid_at timestamptz,
  recorded_by uuid not null references public.users (id) on delete restrict,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_period_order check (billing_period_end >= billing_period_start),
  constraint payments_amount_due_non_negative check (amount_due >= 0),
  constraint payments_amount_paid_non_negative check (amount_paid >= 0),
  constraint payments_status_valid check (status in ('pending', 'partially_paid', 'paid', 'overdue'))
);

comment on table public.payments is
  'amount_paid is an accumulated running total, not a per-transaction ledger — individual partial-payment/refund transactions are not separately tracked in this MVP (documented trade-off).';

create unique index payments_one_per_period_uidx
  on public.payments (enrollment_id, billing_period_start)
  where deleted_at is null;
-- Serves the "who owes money right now" Business Snapshot query.
create index payments_status_idx on public.payments (status);

create trigger set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
