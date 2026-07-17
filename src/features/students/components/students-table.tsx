import { StudentRow } from "@/features/students/components/student-row";
import type { Student } from "@/features/students/types";

const HEADERS = ["Name", "Grade", "Parent", "Phone", "Status", "Created"];

export function StudentsTable({ students }: { students: Student[] }) {
  return (
    <div className="border-border overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-border border-b">
            {HEADERS.map((header) => (
              <th
                key={header}
                scope="col"
                className="text-tertiary px-4 py-2 text-xs font-semibold tracking-wide uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <StudentRow key={student.id} student={student} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
