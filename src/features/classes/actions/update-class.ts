"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { classFormSchema, type ClassFormValues } from "@/features/classes/schema";
import { resolveSubjectId, replaceClassSchedule } from "@/features/classes/actions/lib";
import type { ClassActionResult } from "@/features/classes/actions/create-class";

export async function updateClass(
  classId: string,
  input: ClassFormValues,
): Promise<ClassActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Please sign in again." };
  }
  if (!user.roles.includes("owner") && !user.roles.includes("admin")) {
    return { success: false, error: "You don't have permission to manage classes." };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("classes")
    .select("deleted_at")
    .eq("id", classId)
    .maybeSingle();

  if (fetchError) {
    console.error("updateClass lookup failed:", fetchError.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }
  if (!existing) {
    return { success: false, error: "This class no longer exists." };
  }
  if (existing.deleted_at) {
    return { success: false, error: "Archived classes can't be edited. Restore it first." };
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

  const subjectResult = await resolveSubjectId(
    supabase,
    parsed.data.subjectId,
    parsed.data.newSubjectName,
  );
  if ("error" in subjectResult) {
    return { success: false, error: subjectResult.error };
  }

  const { error: updateError } = await supabase
    .from("classes")
    .update({
      name: parsed.data.name,
      subject_id: subjectResult.subjectId,
      level: parsed.data.level,
      teacher_id: parsed.data.teacherId,
      capacity: parsed.data.capacity,
      status: parsed.data.status,
    })
    .eq("id", classId);

  if (updateError) {
    console.error("updateClass failed:", updateError.message);
    return { success: false, error: "Something went wrong while saving. Please try again." };
  }

  const scheduleError = await replaceClassSchedule(supabase, classId, parsed.data.schedule);
  if (scheduleError) {
    console.error("updateClass schedule replace failed:", scheduleError);
  }

  revalidatePath("/classes");
  revalidatePath(`/classes/${classId}`);
  return { success: true, id: classId };
}
