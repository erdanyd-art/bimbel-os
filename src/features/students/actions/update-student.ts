"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { createStudentSchema, type CreateStudentFormValues } from "@/features/students/schema";
import type { CreateStudentResult } from "@/features/students/actions/create-student";

// Reuses createStudentSchema — the field rules are identical for create and
// edit, only what happens with the parsed result differs.
export async function updateStudent(
  studentId: string,
  input: CreateStudentFormValues,
): Promise<CreateStudentResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Please sign in again." };
  }
  if (!user.roles.includes("owner") && !user.roles.includes("admin")) {
    return { success: false, error: "You don't have permission to edit students." };
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
  const { error } = await supabase
    .from("students")
    .update({
      full_name: parsed.data.fullName,
      grade_level: parsed.data.gradeLevel,
      date_of_birth: parsed.data.dateOfBirth,
      parent_name: parsed.data.parentName,
      parent_phone: parsed.data.parentPhone,
      parent_email: parsed.data.parentEmail,
    })
    .eq("id", studentId);

  if (error) {
    console.error("updateStudent failed:", error.message);
    return { success: false, error: "Something went wrong while saving. Please try again." };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  return { success: true };
}
