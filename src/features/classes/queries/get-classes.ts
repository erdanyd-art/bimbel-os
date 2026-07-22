import { createClient } from "@/lib/supabase/server";
import type { Class } from "@/features/classes/types";

const CLASS_COLUMNS =
  "id, name, subject_id, subject_name, level, teacher_id, teacher_name, capacity, status, schedule_summary, deleted_at, created_at, updated_at";

// Reads from classes_with_details (see
// supabase/migrations/20260714180000_class_status_and_details_view.sql).
// Row visibility is entirely RLS: Owner/Admin see every class, Teacher
// sees only classes they're assigned to teach.
export async function getClasses(query?: string): Promise<Class[]> {
  const supabase = await createClient();

  let request = supabase
    .from("classes_with_details")
    .select(CLASS_COLUMNS)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  const term = query?.trim().replace(/[%,()]/g, "");
  if (term) {
    request = request.or(`name.ilike.%${term}%,subject_name.ilike.%${term}%,level.ilike.%${term}%`);
  }

  const { data, error } = await request;

  if (error) {
    console.error("getClasses failed:", error.message);
    throw new Error("Failed to load classes");
  }

  return (data ?? []) as Class[];
}
