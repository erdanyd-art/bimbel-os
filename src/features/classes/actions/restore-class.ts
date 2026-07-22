"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";

export type RestoreClassResult = { success: true } | { success: false; error: string };

export async function restoreClass(classId: string): Promise<RestoreClassResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Please sign in again." };
  }
  if (!user.roles.includes("owner") && !user.roles.includes("admin")) {
    return { success: false, error: "You don't have permission to restore classes." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("classes").update({ deleted_at: null }).eq("id", classId);

  if (error) {
    console.error("restoreClass failed:", error.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/classes");
  revalidatePath(`/classes/${classId}`);
  return { success: true };
}
