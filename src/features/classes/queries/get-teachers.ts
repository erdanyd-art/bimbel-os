import { createClient } from "@/lib/supabase/server";
import type { TeacherOption } from "@/features/classes/types";

type TeacherRow = {
  id: string;
  users: { full_name: string | null; email: string } | null;
};

// Empty until a Teacher account exists and has a teachers row — Teacher
// provisioning is manual for now (see docs/AUTHENTICATION.md); this sprint
// doesn't build Teacher Management, so an empty result here is expected,
// not a bug.
export async function getTeachers(): Promise<TeacherOption[]> {
  const supabase = await createClient();
  const { data, error } = (await supabase
    .from("teachers")
    .select("id, users:user_id(full_name, email)")
    .is("deleted_at", null)) as { data: TeacherRow[] | null; error: { message: string } | null };

  if (error) {
    console.error("getTeachers failed:", error.message);
    throw new Error("Failed to load teachers");
  }

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      name: row.users?.full_name || row.users?.email || "Unknown teacher",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
