import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ToastProvider, Toaster } from "@/components/ui/toast";

// Defense-in-depth: middleware already redirects unauthenticated requests
// away from this route group, but Server Components re-validate independently
// rather than trusting that the request reached here legitimately.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <div className="flex min-h-full flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
        </div>
      </div>
      <Toaster />
    </ToastProvider>
  );
}
