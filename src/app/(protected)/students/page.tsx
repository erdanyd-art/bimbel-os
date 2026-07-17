import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { getStudents } from "@/features/students/queries/get-students";
import { StudentsSearch } from "@/features/students/components/students-search";
import { StudentsEmptyState } from "@/features/students/components/students-empty-state";
import { StudentsList } from "@/features/students/components/students-list";
import { AddStudentDrawer } from "@/features/students/components/add-student-drawer";

export default async function StudentsPage() {
  const [user, students] = await Promise.all([getCurrentUser(), getStudents()]);
  const canCreate = user ? user.roles.includes("owner") || user.roles.includes("admin") : false;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold">Students</h1>
          <p className="text-muted-foreground text-sm">
            Manage student records, parent contact, and enrollment status.
          </p>
        </div>
        {students.length > 0 && canCreate ? <AddStudentDrawer /> : null}
      </div>

      <StudentsSearch />

      {students.length === 0 ? (
        <StudentsEmptyState canCreate={canCreate} />
      ) : (
        <StudentsList students={students} />
      )}
    </div>
  );
}
