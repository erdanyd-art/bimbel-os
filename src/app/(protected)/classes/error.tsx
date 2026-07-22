"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ClassesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <AlertTriangle className="text-destructive size-8" />
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-foreground text-sm font-medium">Couldn&apos;t load classes</p>
        <p className="text-muted-foreground text-sm">Something went wrong. Please try again.</p>
      </div>
      <Button variant="outline" onClick={reset} className="mt-2">
        Retry
      </Button>
    </div>
  );
}
