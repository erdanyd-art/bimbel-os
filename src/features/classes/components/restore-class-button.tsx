"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import { restoreClass } from "@/features/classes/actions/restore-class";

// No confirmation dialog — un-archiving is benign/reversible, unlike
// Archive, so per Principle 1 (no confirmation dialogs for reversible
// actions) this stays a single click.
export function RestoreClassButton({ classId }: { classId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toastManager = useToastManager();

  function handleRestore() {
    if (isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        const result = await restoreClass(classId);
        if (!result.success) {
          setError(result.error);
          return;
        }
        router.refresh();
        toastManager.add({ title: "Class restored.", type: "success", timeout: 4000 });
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleRestore} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
        Restore
      </Button>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
