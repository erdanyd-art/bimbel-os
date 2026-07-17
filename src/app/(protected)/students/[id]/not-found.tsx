import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";

export default function StudentNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <UserX className="text-tertiary size-8" />
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-foreground text-sm font-medium">Student not found</p>
        <p className="text-muted-foreground text-sm">
          This student may have been removed, or the link is incorrect.
        </p>
      </div>
      <Link
        href="/students"
        className="text-foreground mt-2 inline-flex items-center gap-1.5 text-sm hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Students
      </Link>
    </div>
  );
}
