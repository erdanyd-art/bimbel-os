"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { createStudentSchema, type CreateStudentFormValues } from "@/features/students/schema";

export type CreateStudentResult =
  { success: true } | { success: false; error: string; fieldErrors?: Record<string, string> };

export async function createStudent(input: CreateStudentFormValues): Promise<CreateStudentResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Please sign in again." };
  }
  if (!user.roles.includes("owner") && !user.roles.includes("admin")) {
    return { success: false, error: "You don't have permission to add students." };
  }

  const parsed = createStudentSchema.safeParse(input);
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
  const { error } = await supabase.from("students").insert({
    full_name: parsed.data.fullName,
    grade_level: parsed.data.gradeLevel,
    date_of_birth: parsed.data.dateOfBirth,
    parent_name: parsed.data.parentName,
    parent_phone: parsed.data.parentPhone,
    parent_email: parsed.data.parentEmail,
    created_by: user.id,
  });

  // Never forward error.message to the client — it can contain raw
  // constraint/column names. RLS denial and the DB-level DOB check are the
  // only realistic causes here (client + server already validated
  // everything else above), and both map to the same honest message.
  if (error) {
    return { success: false, error: "Something went wrong while saving. Please try again." };
  }

  revalidatePath("/students");
  return { success: true };
}
