"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useToastManager } from "@/components/ui/toast";
import { createStudentSchema, type CreateStudentFormValues } from "@/features/students/schema";
import { createStudent } from "@/features/students/actions/create-student";

const EMPTY_VALUES: CreateStudentFormValues = {
  fullName: "",
  gradeLevel: "",
  dateOfBirth: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
};

const todayIsoDate = new Date().toISOString().split("T")[0];

export function AddStudentDrawer() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CreateStudentFormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toastManager = useToastManager();

  function updateField(field: keyof CreateStudentFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function isDirty() {
    return (Object.keys(EMPTY_VALUES) as (keyof CreateStudentFormValues)[]).some(
      (key) => values[key] !== EMPTY_VALUES[key],
    );
  }

  // Bypasses the unsaved-changes confirmation — used after a successful
  // save, where there's nothing left to "discard."
  function resetAndClose() {
    setOpen(false);
    setValues(EMPTY_VALUES);
    setFieldErrors({});
    setFormError(null);
  }

  // Wired to the drawer's own onOpenChange (fires on Escape, outside click,
  // and the backdrop) as well as the Cancel button, so every dismissal path
  // gets the same unsaved-changes check.
  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    if (nextOpen) {
      setOpen(true);
      return;
    }
    if (isDirty() && !window.confirm("Discard unsaved changes?")) {
      return;
    }
    resetAndClose();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isPending) return;

    setFormError(null);

    const parsed = createStudentSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    startTransition(async () => {
      try {
        const result = await createStudent(values);

        if (!result.success) {
          setFormError(result.error);
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
          return;
        }

        resetAndClose();
        router.refresh();
        toastManager.add({
          title: "Student created successfully.",
          type: "success",
          timeout: 4000,
        });
      } catch {
        // Server Action call itself failed to complete (offline, timeout,
        // an exception that never made it to a structured result) — the
        // form's data is preserved so the user doesn't lose their input.
        setFormError("Network error. Please check your connection and try again.");
      }
    });
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} swipeDirection="right">
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add Student
      </Button>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <DrawerTitle>Add Student</DrawerTitle>
            <DrawerDescription>
              Enter the student and parent details to create a new record.
            </DrawerDescription>

            {formError ? (
              <p
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive mt-4 rounded-md border px-3 py-2 text-sm"
              >
                {formError}
              </p>
            ) : null}

            <fieldset className="mt-6 flex flex-col gap-4" disabled={isPending}>
              <legend className="text-tertiary text-xs font-semibold tracking-wide uppercase">
                Student
              </legend>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">
                  Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  autoFocus
                  value={values.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  aria-invalid={!!fieldErrors.fullName}
                  aria-required="true"
                  aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                />
                {fieldErrors.fullName ? (
                  <p id="fullName-error" className="text-destructive text-xs">
                    {fieldErrors.fullName}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gradeLevel">Grade level</Label>
                <Input
                  id="gradeLevel"
                  value={values.gradeLevel}
                  onChange={(event) => updateField("gradeLevel", event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateOfBirth">Date of birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  max={todayIsoDate}
                  value={values.dateOfBirth}
                  onChange={(event) => updateField("dateOfBirth", event.target.value)}
                  aria-invalid={!!fieldErrors.dateOfBirth}
                  aria-describedby={fieldErrors.dateOfBirth ? "dateOfBirth-error" : undefined}
                />
                {fieldErrors.dateOfBirth ? (
                  <p id="dateOfBirth-error" className="text-destructive text-xs">
                    {fieldErrors.dateOfBirth}
                  </p>
                ) : null}
              </div>
            </fieldset>

            <fieldset className="mt-6 flex flex-col gap-4" disabled={isPending}>
              <legend className="text-tertiary text-xs font-semibold tracking-wide uppercase">
                Parent
              </legend>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="parentName">
                  Parent name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentName"
                  value={values.parentName}
                  onChange={(event) => updateField("parentName", event.target.value)}
                  aria-invalid={!!fieldErrors.parentName}
                  aria-required="true"
                  aria-describedby={fieldErrors.parentName ? "parentName-error" : undefined}
                />
                {fieldErrors.parentName ? (
                  <p id="parentName-error" className="text-destructive text-xs">
                    {fieldErrors.parentName}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="parentPhone">
                  Parent phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={values.parentPhone}
                  onChange={(event) => updateField("parentPhone", event.target.value)}
                  aria-invalid={!!fieldErrors.parentPhone}
                  aria-required="true"
                  aria-describedby={fieldErrors.parentPhone ? "parentPhone-error" : undefined}
                />
                {fieldErrors.parentPhone ? (
                  <p id="parentPhone-error" className="text-destructive text-xs">
                    {fieldErrors.parentPhone}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="parentEmail">Parent email</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={values.parentEmail}
                  onChange={(event) => updateField("parentEmail", event.target.value)}
                  aria-invalid={!!fieldErrors.parentEmail}
                  aria-describedby={fieldErrors.parentEmail ? "parentEmail-error" : undefined}
                />
                {fieldErrors.parentEmail ? (
                  <p id="parentEmail-error" className="text-destructive text-xs">
                    {fieldErrors.parentEmail}
                  </p>
                ) : null}
              </div>
            </fieldset>
          </div>

          <DrawerFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save Student
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
