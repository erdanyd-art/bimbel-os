# Bimbel OS — Role & Permission Matrix

This document defines what each authenticated role is allowed to do, resource by resource. It is a design document only — no schema, RLS policy, or application code is created here. It assumes [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) (the entities), [AUTHENTICATION.md](./AUTHENTICATION.md) (who can log in and why), and [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) (MVP scope) as context.

## Roles

Per [AUTHENTICATION.md](./AUTHENTICATION.md#scope-who-actually-authenticates), only three roles authenticate — Parent/Student are out of scope and never hold an account:

- **Owner** — strategic authority over the Center. Superset of Admin's operational access, plus governance actions (approvals, staff account management, final dispute resolution) that Admin cannot perform.
- **Admin** — the coordination hub. Day-to-day CRUD across nearly every Core Domain entity, but not final authority on exceptions, disputes, or account governance.
- **Teacher** — narrowly scoped. Access limited to the Classes, Class Sessions, and Students they are actually assigned to teach, plus their own Attendance recording and Placement Assessment administration.

**Design principle:** Owner's permissions are a superset of Admin's for all operational (Core/Supporting Domain) data — an Owner should never be blocked from anything happening in their own Center. Where Owner and Admin diverge, it is specifically on governance actions (approving exceptions, final escalation resolution, managing staff accounts) that carry outsized business or trust risk if delegated without oversight.

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Full access |
| 🔶 | Scoped/partial access — see Notes column |
| ❌ | No access |
| C / R / U / D | Create / Read / Update / Delete |

## Permission Matrix — Core Domain

| Resource | Owner | Admin | Teacher | Notes |
|---|---|---|---|---|
| **Student** | ✅ C R U D | ✅ C R U D | 🔶 R | Teacher read is scoped to Students in their own assigned Classes only. "Delete" is archive/deactivate, never a hard delete — history must survive (re-enrollment tracking per [Student](./DOMAIN_MODEL.md#student)). |
| **Parent / Guardian** | ✅ C R U D | ✅ C R U D | ❌ | Per [BUSINESS_WORKFLOW.md](./BUSINESS_WORKFLOW.md#7-payment-collection), parent contact and financial communication is an Admin/Owner responsibility, not a Teacher one. |
| **Enrollment** | ✅ C R U D | ✅ C R U D | ❌ | Admin/Owner handle registration end-to-end. Fee agreements are financial data outside Teacher's scope. Standard discounts: Admin can apply. Exceptions beyond standard policy: Owner approval required (see [Non-CRUD Actions](#non-crud--special-actions)). |
| **Placement Assessment** | 🔶 R U | ✅ C R U | 🔶 C R U | Teacher administers and scores (create/update the result), scoped to assessments they personally administer. Admin schedules and communicates results. Owner reads for oversight and can override a disputed result. No role deletes an assessment result — point-in-time record integrity (per [Placement Assessment](./DOMAIN_MODEL.md#placement-assessment)). *Deferred past MVP per PRD — matrix defined for completeness.* |
| **Class Assignment** | ✅ C R U D | ✅ C R U D | 🔶 R | Teacher reads assignments for their own Classes only; may surface feedback that triggers a reassignment, but cannot directly edit the assignment. Final say on a disputed assignment rests with Owner. |
| **Escalation Case** | ✅ C R U D | ✅ C R U D | 🔶 R | Teacher read is scoped to cases where they are the subject (e.g., substitute dissatisfaction per [BUSINESS_WORKFLOW.md](./BUSINESS_WORKFLOW.md#3-class-reassignment--escalation)) — Teacher cannot create or resolve cases. Admin can log/propose/facilitate; **final resolution authority is Owner's** (see [Non-CRUD Actions](#non-crud--special-actions)). *Deferred past MVP per PRD — matrix defined for completeness.* |
| **Attendance Record** | 🔶 R U | 🔶 R U | 🔶 C R U | Teacher creates/updates attendance only for their own Class Sessions. Admin consolidates and corrects transcription errors (per [BUSINESS_WORKFLOW.md](./BUSINESS_WORKFLOW.md#6-attendance)) but does not originate attendance for a class they didn't teach. Owner has read/correction access for oversight. No role hard-deletes attendance history — it underpins both billing verification and retention-risk analysis. |
| **Invoice** | ✅ C R U D | 🔶 C R U | ❌ | Admin issues invoices, confirms standard payments, applies standard discounts — cannot delete (financial record integrity) and cannot approve a non-standard discount/refund without Owner sign-off. Teacher has no access to financial data. |

## Permission Matrix — Supporting Domain

| Resource | Owner | Admin | Teacher | Notes |
|---|---|---|---|---|
| **Class** | ✅ C R U D | ✅ C R U D | 🔶 R | Admin maintains the catalog day-to-day; Owner sets high-level policy (which subjects/levels are offered at all). Teacher reads only the Classes they're assigned to. |
| **Class Session** | 🔶 R | ✅ C R U D | 🔶 R U | Admin builds/maintains the schedule. Teacher reads their own sessions and may update session status (e.g., marking a session as conducted/cancelled) but cannot reschedule or create sessions. Owner has oversight read access. |
| **Teaching Assignment** | ✅ C R U D | ✅ C R U D | 🔶 R | Admin/Owner assign teachers to Classes, including substitute coverage. Teacher reads only their own assignments. |
| **Business Snapshot** | ✅ R | ✅ R | ❌ | System-generated/aggregated from Core Domain data — no role authors it directly (no C/U/D by any role). Owner is the primary consumer; Admin retains read access for operational visibility. Teacher has no access to Center-wide financials, consistent with Invoice being out of Teacher's scope. |

## Cross-Cutting Resources

| Resource | Owner | Admin | Teacher | Notes |
|---|---|---|---|---|
| **Center settings** (policy: subjects offered, discount limits, pricing policy) | 🔶 R U | 🔶 R | ❌ | The Center itself is a singleton provisioned at setup, not created/deleted through the app — no Create/Delete for any role. Owner sets policy; Admin reads it to operate within it. |
| **Staff accounts** (Owner/Admin/Teacher logins, per [AUTHENTICATION.md](./AUTHENTICATION.md#user--role-model)) | ✅ C R U D — all roles | 🔶 C R U — Teacher accounts only | 🔶 R U — own account only | Admin can invite and edit Teacher accounts but cannot create, edit, or remove Owner or other Admin accounts (prevents privilege escalation) and cannot deactivate/delete even a Teacher account — that's an Owner-only action given its HR sensitivity. Teacher can read/update only their own profile (e.g., contact info, password). |

## Non-CRUD / Special Actions

Several permissions in this system are not naturally expressed as CRUD on a single resource — they're approval or authority checkpoints layered on top of CRUD access:

| Action | Who can perform it | Why it's gated |
|---|---|---|
| Approve a pricing exception / non-standard discount | Owner only | Per [PROJECT_VISION.md](./PROJECT_VISION.md), the Owner "handles sales and finance" and approves pricing exceptions — a direct revenue-integrity control. |
| Finalize/resolve a disputed Escalation Case | Owner only | Per [BUSINESS_WORKFLOW.md](./BUSINESS_WORKFLOW.md#3-class-reassignment--escalation), disputes that survive a meeting need a final call — Admin can facilitate and re-propose, but is not the deciding party when the Owner has been looped in. |
| Override a disputed Placement Assessment result / Class Assignment | Owner only | Same escalation pattern — Admin proposes and negotiates, Owner is the backstop when agreement isn't reached. |
| Confirm a payment as received | Admin, Owner | Routine financial reconciliation — Admin's core coordination responsibility per [BUSINESS_WORKFLOW.md](./BUSINESS_WORKFLOW.md#7-payment-collection). |
| Invite a new Teacher account | Admin, Owner | Routine staffing operation Admin already facilitates day-to-day. |
| Invite a new Admin or Owner account | Owner only | Privilege-equal-or-above provisioning is a governance action, never delegated to a peer or subordinate role. |
| Deactivate/remove any staff account | Owner only | Higher-stakes HR action regardless of which role is being removed. |
| Administer and score a Placement Assessment | Teacher (for assessments they give), Admin (schedules only) | Per [BUSINESS_WORKFLOW.md](./BUSINESS_WORKFLOW.md#2-placement-test), the Teacher is the one who actually administers and scores the test. |
| View the Business Snapshot | Owner, Admin | Per [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md#goals), this is the Owner-visibility mechanism; Admin needs the same operational picture to do their coordination job well. |

## Scoping & Enforcement

The 🔶 (scoped) entries above are not UI-level conveniences — per [AUTHENTICATION.md](./AUTHENTICATION.md#security-considerations), authorization must be enforced at the Row Level Security layer, keyed off the `staff` table's Role and, for Teachers, their active [Teaching Assignment](./DOMAIN_MODEL.md#teaching-assignment) records. Concretely, a Teacher's scoped access to Student, Class, Class Session, Class Assignment, and Attendance Record all resolve through the same underlying join: *"is this row associated with a Class this Teacher currently teaches?"* — a single relationship that should be enforced consistently rather than re-implemented per entity. A hidden UI element is not an access boundary; a denied row-level query is.

## Deferred

Consistent with [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md#mvp-features), permissions for **Placement Assessment** and **Escalation Case** are specified above for architectural completeness but are **not implemented in the MVP** — those workflows remain manual until built. No schema, RLS policy, or route is created by this document; this is a permissions design only, to be implemented alongside each entity when its corresponding feature is built.
