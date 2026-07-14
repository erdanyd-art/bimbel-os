-- Bimbel OS — Integrity fixes and performance tuning
-- Scope: production blockers only (per review). No redesign, no new entities,
-- no business-rule enforcement beyond what prevents actual data corruption.

-- ============================================================================
-- Integrity fix 1: attendance must belong to a consistent (enrollment, session)
-- pair, and new attendance can't be recorded against an already-cancelled
-- session. Both were previously unenforced — a CHECK constraint can't span
-- tables, so this needs a trigger.
-- ============================================================================
create or replace function public.check_attendance_integrity()
returns trigger
language plpgsql
as $$
declare
  enrollment_class_id uuid;
  session_class_id uuid;
  session_status text;
begin
  select class_id, status into session_class_id, session_status
    from public.class_sessions where id = new.class_session_id;

  select class_id into enrollment_class_id
    from public.enrollments where id = new.enrollment_id;

  if enrollment_class_id is distinct from session_class_id then
    raise exception 'attendance: enrollment class (%) does not match session class (%)',
      enrollment_class_id, session_class_id;
  end if;

  -- Only checked on INSERT: a session being retroactively marked cancelled
  -- should not block correcting attendance that was already recorded for it.
  if tg_op = 'INSERT' and session_status = 'cancelled' then
    raise exception 'attendance: cannot record attendance for a cancelled class_session';
  end if;

  return new;
end;
$$;

create trigger attendance_integrity_check
  before insert or update on public.attendance
  for each row execute function public.check_attendance_integrity();

-- ============================================================================
-- Integrity fix 2: a class_session's optional class_schedule_id must belong
-- to the same class as the session itself.
-- ============================================================================
create or replace function public.check_class_session_schedule_consistency()
returns trigger
language plpgsql
as $$
declare
  schedule_class_id uuid;
begin
  if new.class_schedule_id is null then
    return new;
  end if;

  select class_id into schedule_class_id
    from public.class_schedules where id = new.class_schedule_id;

  if schedule_class_id is distinct from new.class_id then
    raise exception 'class_sessions: class_schedule_id belongs to a different class than class_id';
  end if;

  return new;
end;
$$;

create trigger class_session_schedule_consistency
  before insert or update on public.class_sessions
  for each row execute function public.check_class_session_schedule_consistency();

-- ============================================================================
-- Integrity fix 3: prevent overlapping billing periods for the same
-- enrollment. The existing unique(enrollment_id, billing_period_start) only
-- catches an exact duplicate start date, not two periods that overlap with
-- different start dates — a real double-billing risk on financial data.
-- ============================================================================
create extension if not exists btree_gist;

alter table public.payments
  add constraint payments_no_overlapping_periods
  exclude using gist (
    enrollment_id with =,
    daterange(billing_period_start, billing_period_end, '[]') with &&
  ) where (deleted_at is null);

-- ============================================================================
-- Performance: indexes for named, real query patterns only.
-- ============================================================================

-- "Admin searches for a student by name" — students had zero non-PK index.
create index students_full_name_idx on public.students (full_name);

-- "Match an incoming payment screenshot to a family" (docs/BUSINESS_WORKFLOW.md).
create index students_parent_phone_idx on public.students (parent_phone);

-- "Revenue for period X across the whole Center" — the existing composite
-- unique index on payments has enrollment_id as its leading column, so it
-- doesn't serve a query that isn't scoped to one enrollment.
create index payments_billing_period_start_idx on public.payments (billing_period_start);

-- ============================================================================
-- Performance: remove indexes that add write overhead without serving a
-- real query (avoiding over-indexing, not just adding to it).
-- ============================================================================

-- Fully subsumed by enrollments_one_active_per_class_uidx, which carries the
-- identical partial WHERE clause.
drop index if exists public.enrollments_active_idx;

-- Doesn't serve any concretely-named query, unlike the enrollments index above.
drop index if exists public.classes_active_idx;
