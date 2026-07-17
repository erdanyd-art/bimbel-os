"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { StatusDot } from "@/features/students/components/status-dot";
import { formatDate } from "@/features/students/format";
import type { Student } from "@/features/students/types";

// The whole row is clickable (mouse convenience via onClick on <tr>), but
// the accessible/keyboard/no-JS path is a real <Link> on the name — a
// stopPropagation on the link keeps the two from double-navigating.
export function StudentRow({ student }: { student: Student }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/students/${student.id}`)}
      className="hover:bg-muted border-border cursor-pointer border-t"
    >
      <td className="px-4 py-3">
        <Link
          href={`/students/${student.id}`}
          onClick={(event) => event.stopPropagation()}
          className="text-foreground text-sm font-medium hover:underline"
        >
          {student.full_name}
        </Link>
      </td>
      <td className="text-muted-foreground px-4 py-3 text-sm">{student.grade_level ?? "—"}</td>
      <td className="text-muted-foreground px-4 py-3 text-sm">{student.parent_name}</td>
      <td className="text-muted-foreground px-4 py-3 font-mono text-sm">{student.parent_phone}</td>
      <td className="px-4 py-3">
        <StatusDot status={student.status} />
      </td>
      <td className="text-muted-foreground px-4 py-3 font-mono text-sm">
        {formatDate(student.created_at)}
      </td>
    </tr>
  );
}
