import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/features/students/types";

// Reads from students_with_status (see
// supabase/migrations/20260714170000_student_notes_and_status_view.sql),
// not students directly — status and active_class_names are derived there,
// not columns on the table. Row visibility is entirely RLS: Owner/Admin see
// every student, Teacher sees only their own classes' active rosters.
export async function getStudents(): Promise<Student[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("students_with_status")
    .select(
      "id, full_name, grade_level, date_of_birth, parent_name, parent_phone, parent_email, status, active_class_names",
    )
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load students: ${error.message}`);
  }

  return (data ?? []) as Student[];
}
