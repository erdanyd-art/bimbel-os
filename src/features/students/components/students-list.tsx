import type { Student } from "@/features/students/types";

// Deliberately minimal — proves a created student appears immediately
// (this sprint's success criterion) without building the sortable,
// filterable, paginated table from the design review. That's Sprint 9.
export function StudentsList({ students }: { students: Student[] }) {
  return (
    <ul className="divide-border divide-y rounded-lg border">
      {students.map((student) => (
        <li key={student.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-medium">{student.full_name}</p>
            <p className="text-muted-foreground truncate text-sm">
              {student.parent_name} · {student.parent_phone}
            </p>
          </div>
          <span className="text-tertiary shrink-0 text-xs capitalize">{student.status}</span>
        </li>
      ))}
    </ul>
  );
}
