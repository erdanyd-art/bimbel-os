# Bimbel OS — Domain Model

This document identifies the business entities of Bimbel OS, derived from [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md), [PROJECT_VISION.md](./PROJECT_VISION.md), and [BUSINESS_WORKFLOW.md](./BUSINESS_WORKFLOW.md). It describes real-world business concepts and how they relate to one another — not database tables, screens, or code structures.

## How Entities Are Grouped

Entities are classified using standard Domain-Driven Design strategic patterns:

- **Core Domain** — the concepts that directly drive the business outcome Bimbel OS exists for (per the Vision: revenue integrity, student retention, and owner visibility without manual compilation). These deserve the most design attention because they capture the actual complexity and the non-linear loops documented in the workflow.
- **Supporting Domain** — concepts necessary to operate the core domain, but which are not themselves the source of competitive value. They could, in principle, be handled generically without weakening the business.
- **Shared Concepts** — cross-cutting ideas referenced by multiple entities across both domains. No single workflow "owns" them; they provide common language and structure.

---

## Core Domain

### Student

- **Purpose:** Represents the individual receiving tutoring — the actual subject of the business's value and the center's primary asset relationship.
- **Responsibilities:** Carries academic identity (grade level, subjects of interest) and enrollment history over time, including gaps and re-enrollments.
- **Relationships:** Belongs to a Parent/Guardian; is the subject of an Enrollment, a Placement Assessment, a Class Assignment, Attendance Records, and Invoices.

### Parent / Guardian

- **Purpose:** Represents the decision-maker and financial responsible party — the person who enrolls the student, pays tuition, and must agree to any change in class placement.
- **Responsibilities:** Initiates enrollment inquiries, makes payment decisions, and is the counterparty in any negotiation (placement disputes, billing disputes).
- **Relationships:** Responsible for one or more Students; party to an Escalation Case when disagreement occurs; payer on an Invoice.

### Enrollment

- **Purpose:** Captures the business event of a Student formally joining the center — the moment an inquiry becomes a committed, paying relationship.
- **Responsibilities:** Establishes the agreed fee, start date, and initial (tentative) class expectation set with the Parent.
- **Relationships:** Created for a Student by a Parent; precedes a Placement Assessment; is the origin point that an Invoice's billing cycle is anchored to.

### Placement Assessment

- **Purpose:** Determines a Student's actual working level in a subject, independent of what was assumed or promised at Enrollment.
- **Responsibilities:** Produces a result that either confirms or contradicts the Student's tentative class, and triggers a Class Assignment decision.
- **Relationships:** Performed for a Student following Enrollment; its result is the most common trigger for an Escalation Case.

### Class Assignment

- **Purpose:** Represents the current, authoritative answer to "which Class is this Student actually in" — distinct from Class itself because this answer changes over time and is often contested.
- **Responsibilities:** Reflects the outcome of a Placement Assessment or a later reassignment trigger (teacher feedback, parent request); records that the current assignment was reached, without necessarily being the first proposal.
- **Relationships:** Links a Student to a Class; produced or revised by an Escalation Case when the assignment is disputed; consulted by Attendance to determine which roster a Student belongs to.

### Escalation Case

- **Purpose:** Captures the recurring negotiation pattern identified in the workflow analysis — propose, reject, meet, re-propose — that occurs whenever a change affecting a Student or Parent is not immediately accepted. This is the entity that makes the business's non-linear reality explicit rather than hidden inside "it's complicated."
- **Responsibilities:** Tracks what was proposed, who objected, what meeting or conversation occurred, and what (if anything) was ultimately agreed — so a case is not re-litigated from scratch if it recurs.
- **Relationships:** Most commonly raised against a Class Assignment (placement disputes) or an Invoice (payment disputes), and occasionally a Teaching Assignment (substitute dissatisfaction); involves a Parent, an Admin, and often the Owner; may resolve into a revised Class Assignment, a revised Invoice, or the Student disengaging.

### Attendance Record

- **Purpose:** Represents the fact of a Student's presence, absence, or lateness for a specific Class Session — the ground truth behind both billing accuracy and early retention risk.
- **Responsibilities:** Provides the evidence used to verify what should be billed, and the pattern data (repeated absence) that should trigger a proactive conversation before a Parent complains.
- **Relationships:** Recorded by a Teacher for a Student against a Class Session; referenced by Invoice for billing verification; a pattern of Attendance Records can itself become the trigger for an Escalation Case.

### Invoice

- **Purpose:** Represents the financial obligation and settlement between the center and a Parent for a Student's tuition over a billing period.
- **Responsibilities:** States what is owed, tracks what has been confirmed as paid, and reflects any agreed discount or adjustment — becoming the definitive record of a family's account status.
- **Relationships:** Issued to a Parent for a Student, anchored to an Enrollment's fee agreement and a Term; may be verified against Attendance Records; may become the subject of an Escalation Case if disputed.

---

## Supporting Domain

### Class

- **Purpose:** Represents an offering — a subject and level taught on a recurring basis — that Students can be assigned to. It is a catalog concept, not itself where the business's complexity or value lives; the complexity lives in how Students move in and out of it (see Core Domain).
- **Responsibilities:** Defines subject, level, and capacity; exists independently of which specific Students currently occupy it.
- **Relationships:** Populated by Class Assignments; delivered through one or more Class Sessions; taught via a Teaching Assignment.

### Class Session

- **Purpose:** Represents a single scheduled occurrence of a Class — a specific date, time, and (implicitly) location where teaching happens.
- **Responsibilities:** Defines when a Class actually runs, which is the basis against which Attendance is recorded.
- **Relationships:** Belongs to a Class; staffed by a Teaching Assignment; the object against which each Attendance Record is logged.

### Teacher

- **Purpose:** Represents the person who delivers instruction — a resource whose availability, subject expertise, and reliability directly shape what the center can schedule.
- **Responsibilities:** Holds subject qualifications and availability; delivers Class Sessions and records Attendance.
- **Relationships:** Assigned to Classes through a Teaching Assignment; may become the indirect subject of an Escalation Case (substitute dissatisfaction).

### Teaching Assignment

- **Purpose:** Represents the (often time-bound) mapping of a Teacher to a Class, including temporary substitute coverage.
- **Responsibilities:** Establishes who is responsible for delivering a given Class's sessions during a given period, and provides the basis for teacher compensation calculations.
- **Relationships:** Links a Teacher to a Class; referenced when calculating pay owed for delivered Class Sessions; changes (e.g., a substitute swap) can trigger an Escalation Case.

### Business Snapshot

- **Purpose:** Represents a point-in-time summary of business health — enrollment counts, revenue collected versus outstanding, class utilization — the artifact the Owner uses to monitor the business. It sits in Supporting rather than Core because its value is entirely derivative: it is only as good as the accuracy of the Core Domain entities feeding it, and it does not itself differentiate the business.
- **Responsibilities:** Aggregates data drawn from Enrollment, Attendance, Invoice, and Class Assignment activity over a period.
- **Relationships:** Compiled from Core Domain entities; consumed by the Owner (via the Owner Role) to make staffing, pricing, and growth decisions.

---

## Shared Concepts

### Person

- **Purpose:** The underlying identity concept shared by every human actor in the system — Student, Parent, Teacher, Admin, and Owner all begin as a Person with a name and contact information.
- **Responsibilities:** Holds identity and contact details independent of any role someone plays.
- **Relationships:** Specialized by Role into Student, Parent, Teacher, Admin, or Owner — the same real person can hold more than one Role over time (e.g., an Owner who also teaches).

### Role

- **Purpose:** Represents the capacity in which a Person is acting — Owner, Admin, Teacher, or Parent — and the responsibilities and authority that come with it, as distinct from the person's identity.
- **Responsibilities:** *Owner* sets strategy, approves exceptions, and consumes Business Snapshots. *Admin* is the coordination hub — performs or facilitates nearly every Core Domain workflow (Enrollment, Class Assignment, Attendance consolidation, Invoice tracking, Escalation Case handling).
- **Relationships:** Applied to a Person; referenced throughout the Core and Supporting Domain as "who performs" or "who decides" for a given entity.

### Center

- **Purpose:** Represents the tutoring business itself — the boundary within which all Students, Teachers, Classes, and financial activity exist. Per the Vision, Bimbel OS is scoped to a single center's operations, not a multi-branch or franchise structure.
- **Responsibilities:** Provides the identity boundary that all other entities implicitly belong to.
- **Relationships:** Owns all Classes, Teachers, Students (via Enrollment), and financial activity (via Invoice).

### Money (Fee)

- **Purpose:** Represents a monetary amount with any applicable adjustment — the agreed tuition fee, a sibling discount, a partial payment, a refund.
- **Responsibilities:** Provides a consistent way to express "how much" across Enrollment agreements and Invoices, including exceptions like discounts.
- **Relationships:** Used within Enrollment (agreed fee) and Invoice (amount owed, amount paid, adjustments).

### Term / Billing Cycle

- **Purpose:** Represents the recurring time period (e.g., a month or an academic term) that scheduling, billing, and reporting are organized around.
- **Responsibilities:** Anchors when an Invoice is due, when a Class Session schedule repeats, and what period a Business Snapshot covers.
- **Relationships:** Referenced by Invoice, Class Session scheduling, and Business Snapshot.

---

## Summary Table

| Entity | Category |
|---|---|
| Student | Core Domain |
| Parent / Guardian | Core Domain |
| Enrollment | Core Domain |
| Placement Assessment | Core Domain |
| Class Assignment | Core Domain |
| Escalation Case | Core Domain |
| Attendance Record | Core Domain |
| Invoice | Core Domain |
| Class | Supporting Domain |
| Class Session | Supporting Domain |
| Teacher | Supporting Domain |
| Teaching Assignment | Supporting Domain |
| Business Snapshot | Supporting Domain |
| Person | Shared Concept |
| Role | Shared Concept |
| Center | Shared Concept |
| Money (Fee) | Shared Concept |
| Term / Billing Cycle | Shared Concept |
