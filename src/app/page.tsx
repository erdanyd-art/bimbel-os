import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Bimbel OS</h1>
      <p className="text-muted-foreground max-w-sm text-center text-sm">
        Foundation is set up. No business features have been built yet.
      </p>
      <Button variant="outline" disabled>
        Coming soon
      </Button>
    </div>
  );
}
