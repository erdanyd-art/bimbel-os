import { createClient } from "@/lib/supabase/server";
import type { Class } from "@/features/classes/types";

const CLASS_COLUMNS =
  "id, name, subject_id, subject_name, level, teacher_id, teacher_name, capacity, status, schedule_summary, deleted_at, created_at, updated_at";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Deliberately does NOT filter deleted_at is null — the detail page needs
// to render an archived class too (to show the "Archived" banner and offer
// Restore), unlike getClasses(), which is the default/active-only list.
export async function getClassById(id: string): Promise<Class | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes_with_details")
    .select(CLASS_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getClassById failed:", error.message);
    throw new Error("Failed to load class");
  }

  return data as Class | null;
}
