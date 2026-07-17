import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/features/students/types";

const STUDENT_COLUMNS =
  "id, full_name, grade_level, date_of_birth, parent_name, parent_phone, parent_email, status, active_class_names, created_at, updated_at";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Returns null (not an error) for: a malformed id, a genuinely nonexistent
// id, a soft-deleted student, or a student outside the caller's RLS scope
// (e.g. a Teacher guessing another teacher's student). All four cases
// should render the same "not found" page — distinguishing them would leak
// which ids exist to someone who isn't allowed to see them.
export async function getStudentById(id: string): Promise<Student | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students_with_status")
    .select(STUDENT_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("getStudentById failed:", error.message);
    throw new Error("Failed to load student");
  }

  return data as Student | null;
}
