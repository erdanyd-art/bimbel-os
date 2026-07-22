"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { StatusDot } from "@/components/ui/status-dot";
import { formatDate } from "@/lib/format";
import type { Class } from "@/features/classes/types";

// Same whole-row-clickable pattern as StudentRow: onClick on <tr> for mouse
// convenience, a real <Link> on the name for keyboard/screen-reader/no-JS.
export function ClassRow({ classItem }: { classItem: Class }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/classes/${classItem.id}`)}
      className="hover:bg-muted border-border cursor-pointer border-t"
    >
      <td className="px-4 py-3">
        <Link
          href={`/classes/${classItem.id}`}
          onClick={(event) => event.stopPropagation()}
          className="text-foreground text-sm font-medium hover:underline"
        >
          {classItem.name}
        </Link>
      </td>
      <td className="text-muted-foreground px-4 py-3 text-sm">{classItem.subject_name ?? "—"}</td>
      <td className="text-muted-foreground px-4 py-3 text-sm">{classItem.level ?? "—"}</td>
      <td className="text-muted-foreground px-4 py-3 text-sm">{classItem.teacher_name ?? "—"}</td>
      <td className="text-muted-foreground px-4 py-3 text-sm">
        {classItem.schedule_summary ?? "—"}
      </td>
      <td className="text-muted-foreground px-4 py-3 font-mono text-sm">{classItem.capacity}</td>
      <td className="px-4 py-3">
        <StatusDot active={classItem.status === "active"} label={classItem.status} />
      </td>
      <td className="text-muted-foreground px-4 py-3 font-mono text-sm">
        {formatDate(classItem.created_at)}
      </td>
    </tr>
  );
}
