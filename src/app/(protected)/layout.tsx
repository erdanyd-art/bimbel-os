import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/queries/get-current-user";

// Defense-in-depth: middleware already redirects unauthenticated requests
// away from this route group, but Server Components re-validate independently
// rather than trusting that the request reached here legitimately.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
