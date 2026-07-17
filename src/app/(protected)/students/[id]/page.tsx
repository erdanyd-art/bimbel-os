import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getStudentById } from "@/features/students/queries/get-student";
import { StatusDot } from "@/features/students/components/status-dot";
import { formatDate, formatDateTime } from "@/features/students/format";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);

  if (!student) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <Link
        href="/students"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to Students
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-foreground text-xl font-semibold">{student.full_name}</h1>
        <StatusDot status={student.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="border-border rounded-lg border p-4">
          <h2 className="text-tertiary mb-3 text-xs font-semibold tracking-wide uppercase">
            Student
          </h2>
          <dl className="flex flex-col gap-3">
            <Field label="Full name" value={student.full_name} />
            <Field label="Grade level" value={student.grade_level ?? "—"} />
            <Field
              label="Date of birth"
              value={student.date_of_birth ? formatDate(student.date_of_birth) : "—"}
              mono
            />
          </dl>
        </section>

        <section className="border-border rounded-lg border p-4">
          <h2 className="text-tertiary mb-3 text-xs font-semibold tracking-wide uppercase">
            Parent
          </h2>
          <dl className="flex flex-col gap-3">
            <Field label="Parent name" value={student.parent_name} />
            <Field label="Parent phone" value={student.parent_phone} mono />
            <Field label="Parent email" value={student.parent_email ?? "—"} />
          </dl>
        </section>
      </div>

      <section className="border-border rounded-lg border p-4">
        <h2 className="text-tertiary mb-3 text-xs font-semibold tracking-wide uppercase">
          Metadata
        </h2>
        <dl className="flex flex-col gap-4 sm:flex-row sm:gap-10">
          <Field label="Created at" value={formatDateTime(student.created_at)} mono />
          <Field label="Last updated" value={formatDateTime(student.updated_at)} mono />
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
