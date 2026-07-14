"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const DEFAULT_REDIRECT = "/dashboard";

// Only relative, same-origin paths are honored — prevents an open redirect via
// a crafted redirectTo value.
function safeRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return DEFAULT_REDIRECT;
}

function loginFailureRedirect(redirectTo: string): never {
  redirect(`/login?error=1&redirectTo=${encodeURIComponent(redirectTo)}`);
}

export async function login(formData: FormData): Promise<void> {
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    loginFailureRedirect(redirectTo);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  // Deliberately generic on any failure — never reveals whether the email
  // exists, matching the enumeration-safe flow in docs/USER_FLOW.md.
  if (error) {
    loginFailureRedirect(redirectTo);
  }

  redirect(redirectTo);
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
