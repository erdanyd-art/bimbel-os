import { BookOpen, SearchX } from "lucide-react";

import { AddClassDrawer } from "@/features/classes/components/add-class-drawer";
import type { SubjectOption, TeacherOption } from "@/features/classes/types";

export function ClassesEmptyState({
  canCreate,
  searchQuery,
  subjects,
  teachers,
}: {
  canCreate: boolean;
  searchQuery?: string;
  subjects: SubjectOption[];
  teachers: TeacherOption[];
}) {
  if (searchQuery) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <SearchX className="text-tertiary size-8" />
        <div className="flex max-w-xs flex-col gap-1">
          <p className="text-foreground text-sm font-medium">
            No matches for &quot;{searchQuery}&quot;
          </p>
          <p className="text-muted-foreground text-sm">Try a different name, subject, or level.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <BookOpen className="text-tertiary size-8" />
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-foreground text-sm font-medium">No classes yet</p>
        <p className="text-muted-foreground text-sm">
          {canCreate
            ? "Add your first class to begin."
            : "No classes have been assigned to you yet."}
        </p>
      </div>
      {canCreate ? (
        <div className="mt-2">
          <AddClassDrawer subjects={subjects} teachers={teachers} />
        </div>
      ) : null}
    </div>
  );
}
