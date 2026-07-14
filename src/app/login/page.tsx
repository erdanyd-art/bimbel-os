import { login } from "@/features/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";
  const redirectTo = params.redirectTo ?? "/dashboard";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">Bimbel OS</h1>
        <p className="text-muted-foreground text-sm">Sign in to continue.</p>
      </div>

      <form action={login} className="flex w-full max-w-sm flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {hasError ? (
          <p role="alert" className="text-destructive text-sm">
            Email or password is incorrect.
          </p>
        ) : null}

        <Button type="submit" className="mt-1">
          Sign in
        </Button>
      </form>
    </div>
  );
}
