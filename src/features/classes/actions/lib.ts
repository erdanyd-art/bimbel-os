import type { createClient } from "@/lib/supabase/server";
import type { ScheduleSlot } from "@/features/classes/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Shared by create-class.ts and update-class.ts — not itself a Server
// Action, just an internal helper, so it isn't marked "use server".
export async function resolveSubjectId(
  supabase: SupabaseServerClient,
  subjectId: string | null,
  newSubjectName: string | null,
): Promise<{ subjectId: string } | { error: string }> {
  if (subjectId) {
    return { subjectId };
  }

  if (!newSubjectName) {
    return { error: "Please select or create a subject." };
  }

  // Case-insensitive match first, to avoid "Matematika" vs "matematika"
  // duplicates in the subjects catalog every time someone types it slightly
  // differently.
  const { data: existing, error: lookupError } = await supabase
    .from("subjects")
    .select("id")
    .ilike("name", newSubjectName)
    .is("deleted_at", null)
    .maybeSingle();

  if (lookupError) {
    console.error("resolveSubjectId lookup failed:", lookupError.message);
    return { error: "Something went wrong while saving. Please try again." };
  }

  if (existing) {
    return { subjectId: existing.id };
  }

  const { data: created, error: createError } = await supabase
    .from("subjects")
    .insert({ name: newSubjectName })
    .select("id")
    .single();

  if (createError || !created) {
    console.error("resolveSubjectId creation failed:", createError?.message);
    return { error: "Something went wrong while saving. Please try again." };
  }

  return { subjectId: created.id };
}

// Replace-all strategy: soft-delete every active slot for this class, then
// insert the submitted set fresh. Simpler than diffing individual slots,
// and safe today specifically because nothing yet references a
// class_schedules row by id (no Class Sessions exist to lose their link).
export async function replaceClassSchedule(
  supabase: SupabaseServerClient,
  classId: string,
  schedule: ScheduleSlot[],
): Promise<string | null> {
  const { error: clearError } = await supabase
    .from("class_schedules")
    .update({ deleted_at: new Date().toISOString() })
    .eq("class_id", classId)
    .is("deleted_at", null);

  if (clearError) {
    return clearError.message;
  }

  if (schedule.length === 0) {
    return null;
  }

  const { error: insertError } = await supabase.from("class_schedules").insert(
    schedule.map((slot) => ({
      class_id: classId,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
      end_time: slot.endTime,
    })),
  );

  return insertError?.message ?? null;
}
