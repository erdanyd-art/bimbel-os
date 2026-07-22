import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { getClassById } from "@/features/classes/queries/get-class";
import { getClassSchedules } from "@/features/classes/queries/get-class-schedules";
import { getSubjects } from "@/features/classes/queries/get-subjects";
import { getTeachers } from "@/features/classes/queries/get-teachers";
import { StatusDot } from "@/components/ui/status-dot";
import { formatDateTime } from "@/lib/format";
import { EditClassDrawer } from "@/features/classes/components/edit-class-drawer";
import { ArchiveClassButton } from "@/features/classes/components/archive-class-button";
import { RestoreClassButton } from "@/features/classes/components/restore-class-button";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const classItem = await getClassById(id);

  if (!classItem) {
    notFound();
  }

  const [user, schedule, subjects, teachers] = await Promise.all([
    getCurrentUser(),
    getClassSchedules(id),
    getSubjects(),
    getTeachers(),
  ]);
  const canManage = user ? user.roles.includes("owner") || user.roles.includes("admin") : false;
  const isArchived = classItem.deleted_at !== null;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <Link
        href="/classes"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to Classes
      </Link>

      {isArchived ? (
        <div className="border-warning/30 bg-warning/10 flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">This class is archived and can&apos;t be edited.</p>
          {canManage ? <RestoreClassButton classId={classItem.id} /> : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-foreground text-xl font-semibold">{classItem.name}</h1>
          <StatusDot active={classItem.status === "active"} label={classItem.status} />
        </div>
        {canManage && !isArchived ? (
          <div className="flex items-center gap-2">
            <EditClassDrawer
              classItem={classItem}
              schedule={schedule}
              subjects={subjects}
              teachers={teachers}
            />
            <ArchiveClassButton classId={classItem.id} />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="border-border rounded-lg border p-4">
          <h2 className="text-tertiary mb-3 text-xs font-semibold tracking-wide uppercase">
            General
          </h2>
          <dl className="flex flex-col gap-3">
            <Field label="Name" value={classItem.name} />
            <Field label="Subject" value={classItem.subject_name ?? "—"} />
            <Field label="Level" value={classItem.level ?? "—"} />
          </dl>
        </section>

        <section className="border-border rounded-lg border p-4">
          <h2 className="text-tertiary mb-3 text-xs font-semibold tracking-wide uppercase">
            Schedule
          </h2>
          {classItem.schedule_summary ? (
            <p className="text-foreground font-mono text-sm">{classItem.schedule_summary}</p>
          ) : (
            <p className="text-muted-foreground text-sm">No weekly schedule set yet.</p>
          )}
        </section>

        <section className="border-border rounded-lg border p-4">
          <h2 className="text-tertiary mb-3 text-xs font-semibold tracking-wide uppercase">
            Teacher
          </h2>
          {classItem.teacher_name ? (
            <p className="text-foreground text-sm">{classItem.teacher_name}</p>
          ) : (
            <p className="text-muted-foreground text-sm">No teacher assigned yet.</p>
          )}
        </section>

        <section className="border-border rounded-lg border p-4">
          <h2 className="text-tertiary mb-3 text-xs font-semibold tracking-wide uppercase">
            Capacity
          </h2>
          <p className="text-foreground font-mono text-sm">0 / {classItem.capacity}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">No students yet.</p>
        </section>
      </div>

      <section className="border-border rounded-lg border p-4">
        <h2 className="text-tertiary mb-3 text-xs font-semibold tracking-wide uppercase">
          Metadata
        </h2>
        <dl className="flex flex-col gap-4 sm:flex-row sm:gap-10">
          <Field label="Created" value={formatDateTime(classItem.created_at)} mono />
          <Field label="Updated" value={formatDateTime(classItem.updated_at)} mono />
        </dl>
      </section>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={mono ? "text-foreground font-mono text-sm" : "text-foreground text-sm"}>
        {value}
      </dd>
    </div>
  );
}
