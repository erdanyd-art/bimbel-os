import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/features/students/types";

const STUDENT_COLUMNS =
  "id, full_name, grade_level, date_of_birth, parent_name, parent_phone, parent_email, status, active_class_names, created_at, updated_at";

// Reads from students_with_status (see
// supabase/migrations/20260714170000_student_notes_and_status_view.sql),
// not students directly — status and active_class_names are derived there,
// not columns on the table. Row visibility is entirely RLS: Owner/Admin see
// every student, Teacher sees only their own classes' active rosters.
export async function getStudents(query?: string): Promise<Student[]> {
  const supabase = await createClient();

  let request = supabase
    .from("students_with_status")
    .select(STUDENT_COLUMNS)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  // Strip characters that are syntactically significant to PostgREST's
  // .or() filter grammar (comma separates conditions, parens group them,
  // % is the ILIKE wildcard) rather than trying to escape them — a name
  // search has no real need for any of these characters anyway.
  const term = query?.trim().replace(/[%,()]/g, "");
  if (term) {
    request = request.or(`full_name.ilike.%${term}%,parent_name.ilike.%${term}%`);
  }

  const { data, error } = await request;

  if (error) {
    // Never forward error.message to the client — log it server-side only.
    console.error("getStudents failed:", error.message);
    throw new Error("Failed to load students");
  }

  return (data ?? []) as Student[];
}
