# Bimbel OS — Authentication User Flow

This document specifies the complete user-facing flow for authentication, as Mermaid flowcharts. It is a UX/flow design document — no routes, components, or code are created here. It builds directly on the decisions already made in [AUTHENTICATION.md](./AUTHENTICATION.md) (no public signup, invite-only provisioning, cookie-based sessions, rotating refresh tokens, enumeration-safe password reset) and [ROLE_PERMISSION_MATRIX.md](./ROLE_PERMISSION_MATRIX.md) (role-scoped access).

## Conventions Used in These Diagrams

- There is no public registration screen — every flow below assumes the user already has an account, provisioned by an Owner/Admin invite per [AUTHENTICATION.md](./AUTHENTICATION.md#authentication-flow-login-to-logout).
- "Role-appropriate home" means: Owner → Business Snapshot / dashboard, Admin → operational workspace, Teacher → their assigned Classes/Attendance view — the specific routes are not yet decided and are out of scope for this document.
- Error messaging is deliberately generic wherever it could otherwise leak whether an account/email exists — consistent with the enumeration-safety principle already established for password reset.

---

## 1. Login

The baseline flow: an already-provisioned staff member authenticating with email + password.

```mermaid
flowchart TD
    A([User navigates to /login]) --> B[Enter email + password]
    B --> C[Submit]
    C --> D{Credentials valid?}
    D -->|No| E[[See: Invalid Credentials flow]]
    D -->|Yes| F[Supabase issues access + refresh token]
    F --> G[Session cookies set: httpOnly, Secure]
    G --> H{First login after invite?}
    H -->|Yes| I[Prompt: confirm profile details]
    H -->|No| J[Redirect to role-appropriate home]
    I --> J
    J --> K([Authenticated session active])
```

---

## 2. Invalid Credentials

Expands the failure branch of Login. The message is intentionally generic — it never confirms or denies whether the submitted email has an account, to avoid user enumeration.

```mermaid
flowchart TD
    A([User submits email + password]) --> B{Credentials valid?}
    B -->|Yes| Z[[See: Login flow — success path]]
    B -->|No| C["Show generic error:
    'Email or password is incorrect'"]
    C --> D[Password field cleared, email retained]
    D --> E{Failed attempt count exceeds threshold?}
    E -->|No| F[User may retry immediately]
    E -->|Yes| G[Show cooldown message,
    temporarily rate-limit further attempts]
    G --> H([User waits or uses Forgot Password])
    F --> A
    H --> I[[See: Forgot Password flow]]
```

---

## 3. Forgot Password

Mirrors the Password Reset Flow defined in [AUTHENTICATION.md](./AUTHENTICATION.md#password-reset-flow): enumeration-safe request, single-use time-limited link, and revocation of all other active sessions on success.

```mermaid
flowchart TD
    A([User clicks 'Forgot password' on /login]) --> B[Enter email address]
    B --> C[Submit]
    C --> D["Always show: 'If that email
    has an account, a reset link was sent'"]
    D --> E{Does account exist?}
    E -->|No| F([Flow ends — no email sent, no different UI shown])
    E -->|Yes| G[Recovery email sent with
    single-use, time-limited link]
    G --> H[User opens link]
    H --> I{Link valid and unexpired?}
    I -->|No| J["Show: 'This link has expired,
    request a new one'"] --> A
    I -->|Yes| K[Temporary recovery session established]
    K --> L[User enters new password]
    L --> M[Submit new password]
    M --> N[Password updated]
    N --> O[All other active sessions
    for this account revoked]
    O --> P[Redirect to /login with
    confirmation message]
    P --> Q([User logs in with new password])
```

---

## 4. Logout

User-initiated sign-out. Revocation happens server-side, not just a client-side cookie clear, per [AUTHENTICATION.md](./AUTHENTICATION.md#authentication-flow-login-to-logout).

```mermaid
flowchart TD
    A([Authenticated user clicks Logout]) --> B[Client calls sign-out]
    B --> C[Server revokes refresh token
    for this session]
    C --> D[Session cookies cleared]
    D --> E[Redirect to /login]
    E --> F([Show confirmation:
    'You have been signed out'])
```

---

## 5. Session Expired

Two distinct triggers: a routine silent refresh (invisible to the user, happy path) versus a refresh token that's no longer valid — inactivity timeout, manual revocation, or rotation-reuse detection per [AUTHENTICATION.md](./AUTHENTICATION.md#refresh-token-strategy). Only the second is user-visible. The user's intended destination is preserved so re-login returns them to where they were, minimizing lost work.

```mermaid
flowchart TD
    A([User makes a request while
    holding a session]) --> B{Access token near expiry?}
    B -->|Yes| C[Silent refresh using
    rotating refresh token]
    C --> D{Refresh succeeded?}
    D -->|Yes| E([Request proceeds normally —
    invisible to user])
    D -->|No| F[Session invalid]
    B -->|No, token still fresh| G{Refresh token itself
    valid on this request?}
    G -->|Yes| E
    G -->|No —
    expired / revoked / reuse detected| F
    F --> H[Clear session cookies]
    H --> I[Remember intended destination]
    I --> J[Redirect to /login]
    J --> K["Show: 'Your session has expired,
    please log in again'"]
    K --> L[[See: Login flow]]
    L --> M[On successful login,
    return to remembered destination]
```

---

## 6. Unauthorized Access

Covers two different conditions that both land on a denial, per [ROLE_PERMISSION_MATRIX.md](./ROLE_PERMISSION_MATRIX.md#scoping--enforcement): no session at all, versus a valid session whose role/scope doesn't cover the requested resource (e.g., a Teacher navigating directly to an Invoice URL, or a resource outside their assigned Classes). The denial is enforced server-side regardless of what the UI would have otherwise shown.

```mermaid
flowchart TD
    A([User requests a protected route/resource]) --> B{Session present and valid?}
    B -->|No| C[[See: Session Expired flow,
    or fresh Login flow if never authenticated]]
    B -->|Yes| D{Role/row-level policy
    permits this resource?}
    D -->|Yes| E([Resource loads normally])
    D -->|No| F[Access denied at the
    server/RLS layer — not just hidden UI]
    F --> G[Log the denied attempt
    for audit trail]
    G --> H["Show 403 page:
    'You don't have access to this'"]
    H --> I[Offer link back to
    role-appropriate home]
    I --> J([User does not see any
    data from the denied resource])
```

---

## How These Flows Connect

- **Login** is the entry point every other flow eventually returns to (after logout, after session expiry, after a completed password reset).
- **Invalid Credentials** is a sub-flow of Login's failure branch, not a separate entry point.
- **Session Expired** and **Unauthorized Access** are distinguished deliberately: one is "we don't know who you are anymore," the other is "we know who you are, and the answer is no." Conflating them would either leak permission structure to logged-out users or wrongly imply a permissions problem when the real issue is just an expired session.
- **Forgot Password** and **Logout** are the two flows that actively revoke session state — both terminate in a fresh, unauthenticated state at `/login`.
