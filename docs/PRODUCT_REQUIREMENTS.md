# Bimbel OS

## Problem

Small tutoring centers ("bimbel") typically run with a lean team: one owner who also handles sales and finance, an admin who manages scheduling and payments, and a handful of teachers who deliver classes. Despite serving anywhere from a few dozen to a couple hundred students, most day-to-day operations still run on WhatsApp groups, Excel spreadsheets, Google Sheets, and paper.

New student enrollment usually starts as a WhatsApp conversation between a parent and the admin, who then manually copies the student's details into a spreadsheet and assigns them to a class based on memory or a quick scan of existing rosters. Class schedules are shared as photos of a spreadsheet or typed messages, and any last-minute change — a sick teacher, a moved session — has to be broadcast individually across several WhatsApp groups, with no reliable way to confirm who actually saw the update.

Attendance is recorded on paper by teachers during class and later transcribed into a spreadsheet by the admin, a step that is frequently delayed, skipped, or done inconsistently between teachers. Payment collection follows a similar pattern: parents transfer tuition fees and send a screenshot as proof via WhatsApp, and the admin cross-checks this manually against a running list to determine who has paid, who is late, and who is due for renewal. Because this reconciliation is manual, payments are easily missed, duplicated, or lost among hundreds of chat messages.

The owner, meanwhile, has almost no consolidated view of the business. Questions as basic as how many active students there are this month, which classes are under-enrolled, or how much revenue has come in versus how much is still outstanding require the admin to manually compile numbers from several disconnected spreadsheets and chat threads, often taking hours and prone to error.

As a center grows past a few dozen students, this manual coordination becomes the primary bottleneck: the admin's time is consumed by repetitive data entry and chasing payments rather than supporting teachers and parents, mistakes in scheduling and billing erode trust with parents, and the owner is forced to make decisions about staffing, pricing, and growth without reliable, up-to-date information about the business.

## Target User

Per [PROJECT_VISION.md](./PROJECT_VISION.md), Bimbel OS is built for the owner-operator of a single, independent tutoring center with a few dozen to a couple hundred students and a 3–5 person staff. Two roles will actually use the product day to day:

- **Admin (primary user).** The coordination hub who touches nearly every workflow — registration, scheduling, attendance consolidation, payment tracking, escalation handling (see [BUSINESS_WORKFLOW.md](./BUSINESS_WORKFLOW.md)). The product's day-to-day usability is judged against this person's workload, since their time is the bottleneck the business is capped by.
- **Owner (secondary user).** Consumes summarized business health (enrollment, revenue, class utilization) rather than performing data entry; needs answers in under a minute without interrupting the Admin.

Teachers and Parents are participants in the workflows the product supports (attendance-taking, payment) but are not the primary designed-for user in the MVP — their touchpoints should be as low-friction as possible without requiring them to adopt a full account/login experience if it can be avoided.

## Goals

Restated from the Domain Model's framing of what the Core Domain exists to protect — the product succeeds if it moves these three needles:

1. **Revenue integrity** — every Student's billing obligation is traceable to an Enrollment agreement and verifiable against Attendance, so "who owes what" has one current, trustworthy answer instead of requiring cross-referencing multiple lists.
2. **Student retention** — patterns that put a Student at risk (attendance drop-off, an unresolved Escalation Case) are visible to the Admin/Owner before a parent complaint or refund request, not after.
3. **Owner visibility without manual compilation** — the Owner can answer "how many active students, how much revenue confirmed vs. outstanding, which classes need attention" in under a minute, without asking the Admin to assemble it.

A secondary, cross-cutting goal: reduce the Admin's manual hand-off work (re-typing the same student/payment information across spreadsheets and chat) identified as the cross-cutting bottleneck in [BUSINESS_WORKFLOW.md](./BUSINESS_WORKFLOW.md#cross-cutting-observation).

## MVP Features

Scoped to the Core Domain entities and the workflows that most directly serve the three goals above. Each item maps to an entity in [DOMAIN_MODEL.md](./DOMAIN_MODEL.md):

1. **Student & Parent records** — single record per Student and Parent/Guardian, replacing scattered spreadsheet entries; carries enrollment history so re-enrollment after a gap doesn't mean re-entering data from scratch.
2. **Enrollment** — turn a registration into a Student record with an agreed fee, start date, and tentative Class expectation.
3. **Class & Class Assignment** — a catalog of Classes (subject, level, capacity) and the current, authoritative record of which Class each Student is in.
4. **Attendance recording** — per-Class-Session attendance capture by the Teacher, replacing paper transcription, immediately visible to Admin/Owner.
5. **Invoice & Payment tracking** — record what's owed per Student per billing period, record confirmed payments, and surface a single current view of who has paid, who is late, and who is due for renewal.
6. **Owner dashboard (Business Snapshot)** — a point-in-time summary view: active student count, revenue confirmed vs. outstanding, class utilization/under-enrollment flags.

Deferred past MVP (real Core Domain concepts, but not required to prove the three goals first): **Placement Assessment** as a distinct formal workflow, **Escalation Case** tracking (disputes are handled outside the system for now), **Teaching Assignment** / substitute management and teacher pay calculation, and scheduling conflict detection.

## Out of Scope

Restated from [PROJECT_VISION.md](./PROJECT_VISION.md#what-we-will-deliberately-not-become) as product exclusions, not just aspirational framing:

- No curriculum, content delivery, video lessons, or other student-facing learning tools.
- No marketplace or discovery features connecting parents to tutors/centers.
- No multi-branch/franchise support — single Center scope only, per the [Center](./DOMAIN_MODEL.md#center) entity definition.
- No in-app chat or attempt to replace WhatsApp-style parent communication — the product records outcomes (an Enrollment, an Invoice), not the conversations that produced them.
- No general-purpose accounting, generic CRM, or generic scheduling functionality beyond what the Core Domain workflows require.
