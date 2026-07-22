// Shared across features (Students, Classes) that model an "active" vs
// "inactive" state — the dot+label treatment is the same regardless of
// what's active, so this lives with other UI primitives, not one feature.
export function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={
          active ? "bg-success size-1.5 rounded-full" : "bg-border-strong size-1.5 rounded-full"
        }
      />
      <span className="text-muted-foreground capitalize">{label}</span>
    </span>
  );
}
