"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import { archiveClass } from "@/features/classes/actions/archive-class";

export function ArchiveClassButton({ classId }: { classId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toastManager = useToastManager();

  function handleArchive() {
    if (isPending) return;
    if (
      !window.confirm("Archive this class? It will disappear from the default list until restored.")
    ) {
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const result = await archiveClass(classId);
        if (!result.success) {
          setError(result.error);
          return;
        }
        router.refresh();
        toastManager.add({ title: "Class archived.", type: "success", timeout: 4000 });
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" onClick={handleArchive} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
        Archive
      </Button>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
