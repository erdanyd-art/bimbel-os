import * as React from "react";

import { cn } from "@/lib/utils";

// A thin styled wrapper over the native <select> — same treatment as
// Input/Label, not a custom listbox. A native select is fully accessible
// and keyboard-operable on its own; there's no behavior here to build.
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive h-8 w-full rounded-lg border px-2.5 text-sm transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
