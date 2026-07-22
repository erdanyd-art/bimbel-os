import { ClassRow } from "@/features/classes/components/class-row";
import type { Class } from "@/features/classes/types";

const HEADERS = [
  "Name",
  "Subject",
  "Level",
  "Teacher",
  "Schedule",
  "Capacity",
  "Status",
  "Created",
];

export function ClassesTable({ classes }: { classes: Class[] }) {
  return (
    <div className="border-border overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[880px] text-left">
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
          {classes.map((classItem) => (
            <ClassRow key={classItem.id} classItem={classItem} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
