import { Users } from "lucide-react";

import { AddStudentDrawer } from "@/features/students/components/add-student-drawer";

export function StudentsEmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <Users className="text-tertiary size-8" />
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-foreground text-sm font-medium">No students yet</p>
        <p className="text-muted-foreground text-sm">
          {canCreate
            ? "Add your first student to begin."
            : "No students have been assigned to your classes yet."}
        </p>
      </div>
      {canCreate ? (
        <div className="mt-2">
          <AddStudentDrawer />
        </div>
      ) : null}
    </div>
  );
}
