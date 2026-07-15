"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

// UI only, per Sprint 7 scope — not wired to the students query yet. Kept
// as a real controlled input (not a static mock) so Sprint 8 only has to
// add an onChange-driven query, not build this component from scratch.
export function StudentsSearch() {
  const [value, setValue] = useState("");

  return (
    <div className="relative w-full max-w-sm">
      <Search className="text-tertiary pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="Search students, parents, phone..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="pl-8"
        aria-label="Search students"
      />
    </div>
  );
}
