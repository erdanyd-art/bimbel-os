"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

// URL-driven, server-side search: the query lives in ?q= so it survives a
// refresh and is shareable, and students/page.tsx re-fetches from the
// server on change — no client-side data-fetching layer needed for this.
export function StudentsSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const handle = setTimeout(() => {
      const query = value.trim();
      router.replace(query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname, {
        scroll: false,
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
    // Only re-run when the input value changes — re-running on every
    // searchParams/router change would fight the navigation this effect
    // itself triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="text-tertiary pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="Search by student or parent name..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="pl-8"
        aria-label="Search students"
      />
    </div>
  );
}
