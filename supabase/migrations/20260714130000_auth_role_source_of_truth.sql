-- Bimbel OS — Auth role source-of-truth
-- Makes user_roles/roles the only place a role can live, and gives
-- public.users a reliable way to come into existence at all.
--
-- Fixes production blocker: the application (src/features/auth) previously
-- read role from auth.users.app_metadata, which has no relationship to
-- user_roles/roles. That code has been updated in this same change; this
-- migration provides the two things it depends on to function:
--   1. the fixed role reference rows (owner/admin/teacher) to grant
--   2. a sync path from auth.users into public.users, since user_roles.user_id
--      is a NOT NULL FK to public.users.id and nothing previously created
--      that row for a newly provisioned staff account.

-- ============================================================================
-- Reference data: the fixed role set.
-- Not business/test seed data — this is required for the authorization
-- system to have anything to grant, analogous to enum values.
-- ============================================================================
insert into public.roles (name, description) values
  ('owner', 'Full authority over the Center — strategy, approvals, staff accounts.'),
  ('admin', 'Day-to-day coordination — enrollment, scheduling, attendance, payments.'),
  ('teacher', 'Scoped to assigned classes — attendance, own schedule.')
on conflict (name) do nothing;

-- ============================================================================
-- auth.users -> public.users sync
-- ============================================================================
create or replace function public.handle_auth_user_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

comment on function public.handle_auth_user_sync() is
  'Keeps public.users in sync with auth.users so a staff account provisioned via the Supabase Dashboard, Admin API, or a future invite flow always has a matching public.users row for user_roles/created_by/recorded_by to reference.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_sync();

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user_sync();
