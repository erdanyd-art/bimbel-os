import Link from "next/link";
import { ArrowLeft, BookX } from "lucide-react";

export default function ClassNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <BookX className="text-tertiary size-8" />
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-foreground text-sm font-medium">Class not found</p>
        <p className="text-muted-foreground text-sm">
          This class may have been removed, or the link is incorrect.
        </p>
      </div>
      <Link
        href="/classes"
        className="text-foreground mt-2 inline-flex items-center gap-1.5 text-sm hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Classes
      </Link>
    </div>
  );
}
