import { createClient } from "@/lib/supabase/server";
import type { ScheduleSlot } from "@/features/classes/types";

// Raw slot rows for pre-filling the Edit Class form — classes_with_details
// only carries a formatted display string, not structured data a form can
// bind inputs to.
export async function getClassSchedules(classId: string): Promise<ScheduleSlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_schedules")
    .select("day_of_week, start_time, end_time")
    .eq("class_id", classId)
    .is("deleted_at", null)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("getClassSchedules failed:", error.message);
    throw new Error("Failed to load class schedule");
  }

  return (data ?? []).map((row) => ({
    dayOfWeek: row.day_of_week,
    // Postgres `time` comes back as "HH:MM:SS" — <input type="time"> needs "HH:MM".
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  }));
}
