import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { getClasses } from "@/features/classes/queries/get-classes";
import { getSubjects } from "@/features/classes/queries/get-subjects";
import { getTeachers } from "@/features/classes/queries/get-teachers";
import { ClassesSearch } from "@/features/classes/components/classes-search";
import { ClassesEmptyState } from "@/features/classes/components/classes-empty-state";
import { ClassesTable } from "@/features/classes/components/classes-table";
import { AddClassDrawer } from "@/features/classes/components/add-class-drawer";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [user, classes, subjects, teachers] = await Promise.all([
    getCurrentUser(),
    getClasses(q),
    getSubjects(),
    getTeachers(),
  ]);
  const canCreate = user ? user.roles.includes("owner") || user.roles.includes("admin") : false;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold">Classes</h1>
          <p className="text-muted-foreground text-sm">
            Manage recurring tutoring groups, schedules, and teacher assignments.
          </p>
        </div>
        {canCreate ? <AddClassDrawer subjects={subjects} teachers={teachers} /> : null}
      </div>

      <ClassesSearch />

      {classes.length === 0 ? (
        <ClassesEmptyState
          canCreate={canCreate}
          searchQuery={q}
          subjects={subjects}
          teachers={teachers}
        />
      ) : (
        <ClassesTable classes={classes} />
      )}
    </div>
  );
}
