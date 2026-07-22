"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ClassDetailError({
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
        <p className="text-foreground text-sm font-medium">Couldn&apos;t load this class</p>
        <p className="text-muted-foreground text-sm">Something went wrong. Please try again.</p>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Button variant="outline" onClick={reset}>
          Retry
        </Button>
        <Link
          href="/classes"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to Classes
        </Link>
      </div>
    </div>
  );
}
