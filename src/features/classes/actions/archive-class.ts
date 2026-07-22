"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";

export type ArchiveClassResult = { success: true } | { success: false; error: string };

export async function archiveClass(classId: string): Promise<ArchiveClassResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Please sign in again." };
  }
  if (!user.roles.includes("owner") && !user.roles.includes("admin")) {
    return { success: false, error: "You don't have permission to archive classes." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", classId);

  if (error) {
    console.error("archiveClass failed:", error.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/classes");
  revalidatePath(`/classes/${classId}`);
  return { success: true };
}
