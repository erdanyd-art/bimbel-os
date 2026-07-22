"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { classFormSchema, type ClassFormValues } from "@/features/classes/schema";
import { resolveSubjectId, replaceClassSchedule } from "@/features/classes/actions/lib";

export type ClassActionResult =
  | { success: true; id: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export async function createClass(input: ClassFormValues): Promise<ClassActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Please sign in again." };
  }
  if (!user.roles.includes("owner") && !user.roles.includes("admin")) {
    return { success: false, error: "You don't have permission to manage classes." };
  }

  const parsed = classFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { success: false, error: "Please fix the errors below.", fieldErrors };
  }

  const supabase = await createClient();

  const subjectResult = await resolveSubjectId(
    supabase,
    parsed.data.subjectId,
    parsed.data.newSubjectName,
  );
  if ("error" in subjectResult) {
    return { success: false, error: subjectResult.error };
  }

  const { data: newClass, error: insertError } = await supabase
    .from("classes")
    .insert({
      name: parsed.data.name,
      subject_id: subjectResult.subjectId,
      level: parsed.data.level,
      teacher_id: parsed.data.teacherId,
      capacity: parsed.data.capacity,
      status: parsed.data.status,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !newClass) {
    console.error("createClass insert failed:", insertError?.message);
    return { success: false, error: "Something went wrong while saving. Please try again." };
  }

  if (parsed.data.schedule.length > 0) {
    const scheduleError = await replaceClassSchedule(supabase, newClass.id, parsed.data.schedule);
    if (scheduleError) {
      // The class itself was created successfully — log and let the
      // schedule be added via Edit, rather than reporting a failure for
      // an operation that mostly succeeded.
      console.error("createClass schedule insert failed:", scheduleError);
    }
  }

  revalidatePath("/classes");
  return { success: true, id: newClass.id };
}
