import type { StudentStatus } from "@/features/students/types";

// Shared between the table row and the detail page — one place to decide
// what "active" vs "inactive" looks like.
export function StatusDot({ status }: { status: StudentStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={
          status === "active"
            ? "bg-success size-1.5 rounded-full"
            : "bg-border-strong size-1.5 rounded-full"
        }
      />
      <span className="text-muted-foreground capitalize">{status}</span>
    </span>
  );
}
