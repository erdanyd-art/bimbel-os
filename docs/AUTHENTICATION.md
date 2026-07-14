# Bimbel OS — Authentication Strategy

This document defines the authentication architecture for Bimbel OS. It is a design document — no implementation code — and assumes the reader has [PROJECT_VISION.md](./PROJECT_VISION.md), [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md), and [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) as context.

## Scope: Who Actually Authenticates

Per [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md#target-user), the Admin is the primary user and the Owner the secondary user — both are internal staff operating the system daily. Parents and Students are explicitly **not** meant to adopt a full account/login experience in the MVP; per [PROJECT_VISION.md](./PROJECT_VISION.md#what-we-will-deliberately-not-become), WhatsApp-style personal communication with parents is a feature to preserve, not a flow to replace with a portal.

This means Bimbel OS's authentication surface is scoped to **internal staff only**, mapped from the [Role](./DOMAIN_MODEL.md#role) shared concept:

| Role | Gets a login? | Rationale |
|---|---|---|
| Owner | Yes | Strategic oversight, approves exceptions, consumes the Business Snapshot. |
| Admin | Yes | Coordination hub; performs nearly every Core Domain workflow. |
| Teacher | Yes (scoped) | Needs to record Attendance against their own Class Sessions; access should be narrow. |
| Parent / Student | No (MVP) | Not a designed-for user of the system per the PRD; interacts with the Center through existing channels, not a portal. |

Because there is no self-serve Parent/Student signup and Bimbel OS is scoped to a single [Center](./DOMAIN_MODEL.md#center) (no multi-branch, per Vision), the entire user base is a **small, closed, known roster** — this shapes nearly every decision below toward "controlled provisioning" over "open registration."

## Why Supabase Auth

1. **Already the data platform.** The codebase already uses Supabase for Postgres and has `@supabase/ssr` client/server factories scaffolded ([src/lib/supabase](../src/lib/supabase)). Adopting Supabase Auth avoids introducing a second identity vendor with its own integration surface, billing relationship, and failure domain.
2. **Row Level Security integrates directly with the JWT.** Every Core Domain entity (Student, Invoice, Attendance Record) will need row-level authorization by Role and, later, by Center — Supabase Auth issues a JWT containing `auth.uid()` that Postgres RLS policies can reference natively. This means authorization lives in the database next to the data it protects, not in a separate hand-rolled middleware layer that can drift out of sync.
3. **No dedicated security or platform team.** Per the Vision, this product serves owner-operators with no IT department, and the team building it is small too. A managed auth service (rotating refresh tokens, rate limiting, password hashing, email delivery) removes an entire class of security responsibility that a small team should not be maintaining by hand.
4. **Admin-provisioned accounts are a first-class flow.** Supabase Auth's admin API supports creating and inviting users without exposing a public signup endpoint — a direct fit for the closed-roster model above.

## User & Role Model

- `auth.users` (Supabase-managed) holds credentials and identity — email, hashed password, confirmation state.
- A `staff` (or `profiles`) table, keyed by `auth.users.id`, holds the Bimbel OS–specific [Person](./DOMAIN_MODEL.md#person) and [Role](./DOMAIN_MODEL.md#role) data: name, Role (Owner / Admin / Teacher), and — for Teachers — which Classes they're assigned to. This table is the join between "who can log in" and "what they can do," and is what RLS policies key off of, not the raw JWT alone.
- No public-facing registration route exists. This table and schema design are documented here for context but are **not created in this sprint** — schema creation is a separate, explicit task.

## Authentication Flow: Login to Logout

```mermaid
flowchart TD
    A[Owner/Admin/Teacher provisioned by Admin] --> B[Invite email sent]
    B --> C[User sets initial password via invite link]
    C --> D[/login route]
    D --> E{Email + password valid?}
    E -->|No| D
    E -->|Yes| F[Supabase issues access token + refresh token]
    F --> G[Tokens set as httpOnly cookies via @supabase/ssr]
    G --> H[Redirect to role-appropriate landing]
    H --> I[Server re-validates session on each request]
    I --> J{Access token near expiry?}
    J -->|Yes| K[Silent refresh via rotating refresh token]
    K --> I
    J -->|No| I
    I --> L[User clicks Logout]
    L --> M[signOut revokes refresh token server-side]
    M --> N[Cookies cleared, redirect to /login]
```

**Provisioning (no public signup).** An Owner or Admin creates a new staff account through an internal "invite" action, not a public sign-up form. Supabase sends an invite email containing a single-use link; the invitee follows it to set their own password. This both provisions the account and proves the invitee controls that mailbox in one step (see [Email Verification Strategy](#email-verification-strategy)).

**Login.** The staff member submits email + password at `/login` — chosen as the primary factor over magic links because Admin/Owner typically log in repeatedly from the same shared front-desk device, and a password doesn't depend on checking an inbox they may not monitor closely day-to-day (email is a secondary channel for this business, per the Vision — WhatsApp is primary). Supabase Auth validates the credentials and, on success, issues a short-lived JWT access token and a longer-lived refresh token.

**Session establishment.** Tokens are written as httpOnly, Secure cookies through the `@supabase/ssr` server client already scaffolded in the codebase — never stored in `localStorage` — so both Server Components and Server Actions can read the session on the server, and client-side JavaScript (including any injected via XSS) cannot read the raw tokens.

**Authenticated requests.** Every request to a protected route re-validates the session server-side by calling Supabase's user-fetch endpoint (not by trusting the decoded JWT payload alone), so a tampered or stale cookie is never implicitly trusted.

**Logout.** The client calls Supabase's sign-out method, which revokes the refresh token server-side (not just a client-side cookie clear) and clears the session cookies, then redirects to `/login`. Server-side revocation matters because it invalidates the session even if a copy of the cookie leaked or was cached somewhere.

## Session Handling

- **Cookie-based, not token-in-JS-storage.** This is already the direction the scaffolded `src/lib/supabase/client.ts` and `server.ts` take, and it's the correct choice specifically because it keeps tokens out of reach of `localStorage`-targeting XSS.
- **Server is the source of truth.** Server Components and Server Actions re-derive the authenticated user from Supabase on each request rather than passing a client-asserted role down as a prop — necessary because UI-level role checks are a convenience, not a security boundary; RLS and server-side re-validation are.
- **Session duration is a deliberate trade-off, not a default left alone.** Front-desk devices are often shared and semi-public (per the Business Workflow, the Admin operates from a fixed station during business hours). Recommend a bounded session lifetime with inactivity expiry (e.g., re-authentication after a multi-day gap of inactivity) rather than an indefinite "remember me" — balances low daily friction against the risk of a logged-in session persisting on a shared device indefinitely.
- **Session visibility and revocation.** Owner and Admin should eventually be able to see active sessions for staff accounts and force a sign-out remotely (e.g., a Teacher's phone is lost) — Supabase Auth supports this; not required for the first authentication implementation but should be planned for once staff accounts exist in volume.

## Refresh Token Strategy

- Access tokens are short-lived JWTs (Supabase default: 1 hour) so a leaked access token has a small blast-radius window.
- Refresh tokens are long-lived but **single-use with rotation**: each refresh exchanges the current refresh token for a new access/refresh pair and immediately invalidates the old refresh token. This means a stolen-but-unused refresh token becomes worthless the next time the legitimate session refreshes.
- **Reuse detection.** If a refresh token is presented after it's already been rotated away, that's a strong signal of token theft — Supabase invalidates the entire session family in response. This should surface to the user as a forced re-login with no silent fallback, so a compromised session doesn't quietly persist.
- **Silent refresh in the request path.** Refreshing should happen transparently as part of normal request handling (the standard `@supabase/ssr` middleware pattern) so staff are never abruptly logged out mid-task — refresh timing is invisible to the user in the happy path.

## Password Reset Flow

1. User selects "Forgot password" from `/login` and submits their email.
2. The system always responds with the same "check your email" message regardless of whether that email has an account — **no user enumeration** through differing success/failure messages.
3. If the account exists, Supabase sends a time-limited, single-use recovery link.
4. The link lands on a dedicated `/reset-password` route, which exchanges the recovery token for a temporary recovery session (PKCE-based flow) — this session is only capable of setting a new password, nothing else.
5. On successful password change, **all other active sessions and refresh tokens for that user are revoked**, forcing re-login everywhere else that account was signed in. This closes the gap where a reset is triggered because a device or session was compromised — the reset should end that compromised session, not merely add a new credential alongside it.
6. Redirect to `/login` with confirmation; no auto-login after reset, so the user proves the new password works.

## Email Verification Strategy

Because accounts are **admin-provisioned, not self-registered**, email verification and account activation collapse into a single step: the invite link itself. Clicking it and setting a password is proof of mailbox ownership — there is no separate "verify your email" step required before first login, and no unverified-but-usable account state to worry about, because the account doesn't functionally exist (can't set a password, can't log in) until that link is used.

Supabase's `email_confirmed_at` gate should still be enforced as a defense-in-depth check (an account without a confirmed email cannot complete authentication), even though the invite flow is expected to be the only path that produces confirmed accounts in the MVP.

If a future version introduces any self-registration path (explicitly out of scope now — Parents are excluded from auth per the PRD), that path would need the conventional register → verification-email → confirm sequence before granting a session, since it would no longer have an inviter vouching for the email address.

## Security Considerations

- **Authorization lives in RLS, not in the UI.** Authentication answers "who is this," but what an Owner, Admin, or Teacher can see and do differs sharply — e.g., a Teacher should be scoped to Attendance for their own Class Sessions, not the Center's financials. That boundary must be enforced by Postgres Row Level Security policies keyed on the `staff` table's Role, not by hiding UI elements client-side, since a hidden button is not an access control.
- **No public registration surface at all.** Because every account is provisioned by an Owner/Admin, there is no signup endpoint to rate-limit, no CAPTCHA to tune, and no credential-stuffing target beyond the login form itself — a meaningful reduction in attack surface that falls directly out of the closed-roster model.
- **Anon key vs. service role key separation.** The `NEXT_PUBLIC_SUPABASE_ANON_KEY` (already validated in [env.ts](../src/config/env.ts)) is safe for client exposure because RLS constrains what it can do. A service role key (which bypasses RLS entirely) must only ever be used in trusted server-side code — for admin actions like provisioning invites — and must never be assigned to a `NEXT_PUBLIC_`-prefixed environment variable or reach the client bundle.
- **Password policy.** Enforce a minimum strength policy through Supabase Auth's project settings (minimum length at least; leaked-password protection if available) rather than relying on staff to choose strong passwords unprompted.
- **Rate limiting on login.** Supabase Auth's built-in rate limiting on authentication endpoints is sufficient for this scale (a handful of staff accounts); revisit only if abuse is observed.
- **MFA for the highest-value account.** The Owner account has visibility into the Center's full financial picture (the Business Snapshot) and is the single highest-value target in the system. Recommend enabling TOTP-based MFA for the Owner role at minimum, even if not mandated for Admin/Teacher in the MVP.
- **Audit trail for auth events.** Login, password reset, and role changes should be logged with enough detail to answer "who did what, when" later — consistent with the record-keeping expectation already established for [Escalation Case](./DOMAIN_MODEL.md#escalation-case) elsewhere in the domain, where undocumented history is called out as a recurring pain point.
- **Secure cookie flags in production.** `HttpOnly`, `Secure`, and `SameSite=Lax` (or stricter) on all session cookies — already the direction implied by the existing `@supabase/ssr` server client, and must not be weakened for local-dev convenience in a way that leaks into production configuration.

## Explicitly Deferred

To keep this document aligned with "Foundation Sprint only" boundaries elsewhere in the project: the `staff`/`profiles` table schema, RLS policy definitions, the invite-provisioning admin action, `/login`/`/reset-password` routes, and session-refresh middleware are all **designed here but not implemented** in this document or sprint. Each is a distinct, explicit implementation task.
