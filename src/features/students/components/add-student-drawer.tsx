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

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setValues(EMPTY_VALUES);
      setFieldErrors({});
      setFormError(null);
    }
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
      const result = await createStudent(values);

      if (!result.success) {
        setFormError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }

      handleOpenChange(false);
      router.refresh();
      toastManager.add({
        title: "Student created successfully.",
        type: "success",
        timeout: 4000,
      });
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
                Student Information
              </legend>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">
                  Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={values.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  aria-invalid={!!fieldErrors.fullName}
                />
                {fieldErrors.fullName ? (
                  <p className="text-destructive text-xs">{fieldErrors.fullName}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gradeLevel">Grade / level</Label>
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
                />
                {fieldErrors.dateOfBirth ? (
                  <p className="text-destructive text-xs">{fieldErrors.dateOfBirth}</p>
                ) : null}
              </div>
            </fieldset>

            <fieldset className="mt-6 flex flex-col gap-4" disabled={isPending}>
              <legend className="text-tertiary text-xs font-semibold tracking-wide uppercase">
                Parent / Guardian
              </legend>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="parentName">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentName"
                  value={values.parentName}
                  onChange={(event) => updateField("parentName", event.target.value)}
                  aria-invalid={!!fieldErrors.parentName}
                />
                {fieldErrors.parentName ? (
                  <p className="text-destructive text-xs">{fieldErrors.parentName}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="parentPhone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={values.parentPhone}
                  onChange={(event) => updateField("parentPhone", event.target.value)}
                  aria-invalid={!!fieldErrors.parentPhone}
                />
                {fieldErrors.parentPhone ? (
                  <p className="text-destructive text-xs">{fieldErrors.parentPhone}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="parentEmail">Email</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={values.parentEmail}
                  onChange={(event) => updateField("parentEmail", event.target.value)}
                  aria-invalid={!!fieldErrors.parentEmail}
                />
                {fieldErrors.parentEmail ? (
                  <p className="text-destructive text-xs">{fieldErrors.parentEmail}</p>
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
