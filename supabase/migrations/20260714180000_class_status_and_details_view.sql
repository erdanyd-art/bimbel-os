-- Bimbel OS — Class status + classes_with_details view
-- Supports Sprint 10 (Class Management).
--
-- Schema change justification: unlike a Student's derived status (entirely
-- dependent on Enrollment, which doesn't exist — refused twice already in
-- this project), a Class's operational status ("is this class currently
-- running") is a real, intrinsic fact an Owner/Admin sets directly. It does
-- not depend on Enrollment, so there is something genuine to store here.

alter table public.classes
  add column status text not null default 'active'
  constraint classes_status_valid check (status in ('active', 'inactive'));

comment on column public.classes.status is
  'Operational status, independent of deleted_at (archive). A class can be active/inactive while still not archived.';

-- ============================================================================
-- classes_with_details — same rationale as students_with_status: the table
-- and detail page both need Subject name, Teacher name, and a formatted
-- schedule string alongside the row, and deriving that in every query
-- site would just duplicate the same three joins repeatedly.
-- security_invoker = true: row visibility comes entirely from classes'
-- own RLS (and, transitively, subjects/teachers/users/class_schedules'),
-- not from whichever role happened to create this view.
-- ============================================================================
create view public.classes_with_details
with (security_invoker = true)
as
select
  c.*,
  s.name as subject_name,
  coalesce(u.full_name, u.email) as teacher_name,
  (
    select string_agg(
      (array['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])[cs.day_of_week + 1]
        || ' ' || to_char(cs.start_time, 'HH24:MI') || '–' || to_char(cs.end_time, 'HH24:MI'),
      ', ' order by cs.day_of_week, cs.start_time
    )
    from public.class_schedules cs
    where cs.class_id = c.id and cs.deleted_at is null
  ) as schedule_summary
from public.classes c
left join public.subjects s on s.id = c.subject_id
left join public.teachers t on t.id = c.teacher_id
left join public.users u on u.id = t.user_id;

comment on view public.classes_with_details is
  'classes + subject_name + teacher_name + schedule_summary (formatted, active slots only). security_invoker=true: no access beyond what classes/subjects/teachers/class_schedules RLS already grants the caller.';

grant select on public.classes_with_details to authenticated;
