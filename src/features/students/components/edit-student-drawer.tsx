"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useToastManager } from "@/components/ui/toast";
import { StudentForm } from "@/features/students/components/student-form";
import { createStudentSchema, type CreateStudentFormValues } from "@/features/students/schema";
import { updateStudent } from "@/features/students/actions/update-student";
import type { Student } from "@/features/students/types";

function toFormValues(student: Student): CreateStudentFormValues {
  return {
    fullName: student.full_name,
    gradeLevel: student.grade_level ?? "",
    dateOfBirth: student.date_of_birth ?? "",
    parentName: student.parent_name,
    parentPhone: student.parent_phone,
    parentEmail: student.parent_email ?? "",
  };
}

// initialValues is re-derived from the `student` prop on every render —
// after a successful save, router.refresh() causes the parent page to
// re-fetch and pass updated data, so the next time this drawer opens it's
// already showing the just-saved values, not stale closure state (same
// pattern as EditClassDrawer).
export function EditStudentDrawer({ student }: { student: Student }) {
  const initialValues = toFormValues(student);

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CreateStudentFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toastManager = useToastManager();

  function updateField(field: keyof CreateStudentFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function isDirty() {
    return (Object.keys(initialValues) as (keyof CreateStudentFormValues)[]).some(
      (key) => values[key] !== initialValues[key],
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    if (nextOpen) {
      setValues(initialValues);
      setFieldErrors({});
      setFormError(null);
      setOpen(true);
      return;
    }
    if (isDirty() && !window.confirm("Discard unsaved changes?")) {
      return;
    }
    setOpen(false);
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
        const result = await updateStudent(student.id, values);

        if (!result.success) {
          setFormError(result.error);
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
          return;
        }

        setOpen(false);
        router.refresh();
        toastManager.add({
          title: "Student updated successfully.",
          type: "success",
          timeout: 4000,
        });
      } catch {
        setFormError("Network error. Please check your connection and try again.");
      }
    });
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} swipeDirection="right">
      <Button variant="outline" onClick={() => handleOpenChange(true)}>
        <Pencil className="size-4" />
        Edit
      </Button>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <DrawerTitle>Edit Student</DrawerTitle>
            <DrawerDescription>Update this student&apos;s details.</DrawerDescription>

            {formError ? (
              <p
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive mt-4 rounded-md border px-3 py-2 text-sm"
              >
                {formError}
              </p>
            ) : null}

            <StudentForm
              values={values}
              onFieldChange={updateField}
              fieldErrors={fieldErrors}
              disabled={isPending}
              autoFocusFirstField={false}
            />
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
              Save Changes
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
