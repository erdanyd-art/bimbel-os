import { createClient } from "@/lib/supabase/server";
import type { SubjectOption } from "@/features/classes/types";

export async function getSubjects(): Promise<SubjectOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("getSubjects failed:", error.message);
    throw new Error("Failed to load subjects");
  }

  return data ?? [];
}
