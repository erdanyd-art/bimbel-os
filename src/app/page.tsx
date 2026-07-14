import { redirect } from "next/navigation";

// Unauthenticated requests never reach here — middleware redirects them to
// /login first. Authenticated visitors land on the dashboard.
export default function Home() {
  redirect("/dashboard");
}
