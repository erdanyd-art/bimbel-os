"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;
const useToastManager = ToastPrimitive.useToastManager;

function ToastList() {
  const { toasts } = useToastManager();

  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "bg-card border-border relative w-full rounded-lg border border-l-4 p-3 shadow-[0_4px_16px_rgba(24,24,27,0.08)] transition-all duration-200",
        "data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0",
        "data-[type=success]:border-l-success data-[type=error]:border-l-destructive",
      )}
    >
      <ToastPrimitive.Content className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <ToastPrimitive.Title className="text-foreground text-sm font-medium" />
          <ToastPrimitive.Description className="text-muted-foreground mt-0.5 text-sm" />
        </div>
        <ToastPrimitive.Close
          aria-label="Dismiss"
          className="text-tertiary hover:text-foreground shrink-0 text-xs"
        >
          ✕
        </ToastPrimitive.Close>
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  ));
}

function Toaster() {
  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-[100] flex w-[calc(100vw-2rem)] flex-col gap-2 sm:w-[360px]">
        <ToastList />
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  );
}

export { ToastProvider, Toaster, useToastManager };
