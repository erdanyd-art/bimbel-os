# Bimbel OS — Security Verification Checklist

Manual verification steps for the Row Level Security policies defined in [20260714150000_row_level_security.sql](../supabase/migrations/20260714150000_row_level_security.sql) and tightened in [20260714160000_tighten_teacher_read_only_access.sql](../supabase/migrations/20260714160000_tighten_teacher_read_only_access.sql). Run this after every migration that touches RLS policies — not just once. Requires one real test account per role (Owner, Admin, Teacher), each with `deleted_at is null` and an active `user_roles` grant.

Each item should be checked by actually logging in as that account and attempting the action (via the app once features exist, or directly via the Supabase Table Editor / SQL editor "Run as user" in the meantime) — not inferred from reading the policy SQL.

## Owner can

- [ ] Log in and see own profile + role on the dashboard
- [ ] Read, create, and update every row across all 13 tables
- [ ] Grant or revoke **any** role (`owner`, `admin`, or `teacher`) to/from any user via `user_roles`
- [ ] Read the full `roles` table (all 3 rows)

## Admin can

- [ ] Log in and see own profile + role
- [ ] Full operational CRUD on `students`, `classes`, `enrollments`, `attendance`, `payments`, `subjects`, `class_schedules`, `class_sessions`, `teachers`, `teacher_subjects`
- [ ] Read all `users` rows (the full staff roster)
- [ ] Grant or revoke **only** the `teacher` role via `user_roles`
- [ ] **Cannot** grant or revoke `owner` or `admin` — attempting this must be denied by RLS, not just hidden in the UI
- [ ] Read the full `roles` table

## Teacher can

- [ ] Log in and see own profile + role
- [ ] Read own `users` row — **cannot** read any other user's row
- [ ] Read own `teachers` row and own `teacher_subjects` rows — **cannot** read another teacher's profile or qualifications
- [ ] Read only `classes` where they are the assigned `teacher_id` — **cannot** see classes assigned to other teachers
- [ ] Read only `class_schedules` and `class_sessions` for their own classes
- [ ] Read only `enrollments` and `students` for their own classes' active rosters — **cannot** see students not enrolled in a class they teach
- [ ] Read only `attendance` for sessions of their own classes
- [ ] Read only their own `roles` grant (e.g. sees the `teacher` row, not `owner`/`admin`)

## Teacher cannot (explicit negative checks — these must fail)

- [ ] Any `select` on `payments` returns zero rows
- [ ] Any `insert` or `update` on `attendance` is denied
- [ ] Any `insert` or `update` on `class_sessions` is denied
- [ ] Any `insert`, `update`, or `delete` on `students`, `classes`, `enrollments`, `class_schedules`, `subjects`, `teachers`, `teacher_subjects` is denied
- [ ] Any `insert` or `update` on `user_roles` — including attempting to grant themselves a role — is denied
- [ ] Reading `user_roles` for a `user_id` other than their own returns zero rows

## Known, deliberate gap (not a bug)

Teacher write access to `attendance` and `class_sessions` is currently revoked entirely, even though [ROLE_PERMISSION_MATRIX.md](./ROLE_PERMISSION_MATRIX.md) documents Teacher-taken attendance as the intended long-term design. This is correct **for now** — no attendance-taking feature exists in the app yet, so the write permission would be unused surface. When that feature is built, this checklist's "Teacher cannot" section for `attendance`/`class_sessions` writes needs to be revised alongside it, not left as-is.
