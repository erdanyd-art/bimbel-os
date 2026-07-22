"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useToastManager } from "@/components/ui/toast";
import { ClassForm } from "@/features/classes/components/class-form";
import {
  classFormSchema,
  flattenClassFormErrors,
  type ClassFormValues,
} from "@/features/classes/schema";
import { createClass } from "@/features/classes/actions/create-class";
import type { SubjectOption, TeacherOption } from "@/features/classes/types";

const EMPTY_VALUES: ClassFormValues = {
  name: "",
  subjectId: "",
  newSubjectName: "",
  level: "",
  teacherId: "",
  capacity: "",
  status: "active",
  schedule: [],
};

export function AddClassDrawer({
  subjects,
  teachers,
}: {
  subjects: SubjectOption[];
  teachers: TeacherOption[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ClassFormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [scheduleErrors, setScheduleErrors] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toastManager = useToastManager();

  function updateField<K extends keyof ClassFormValues>(field: K, value: ClassFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function isDirty() {
    return JSON.stringify(values) !== JSON.stringify(EMPTY_VALUES);
  }

  function resetAndClose() {
    setOpen(false);
    setValues(EMPTY_VALUES);
    setFieldErrors({});
    setScheduleErrors({});
    setFormError(null);
  }

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

    const parsed = classFormSchema.safeParse(values);
    if (!parsed.success) {
      const { fieldErrors: errors, scheduleErrors: slotErrors } = flattenClassFormErrors(
        parsed.error,
      );
      setFieldErrors(errors);
      setScheduleErrors(slotErrors);
      return;
    }
    setFieldErrors({});
    setScheduleErrors({});

    startTransition(async () => {
      try {
        const result = await createClass(values);

        if (!result.success) {
          setFormError(result.error);
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
          return;
        }

        resetAndClose();
        router.refresh();
        toastManager.add({
          title: "Class created successfully.",
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
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add Class
      </Button>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <DrawerTitle>Add Class</DrawerTitle>
            <DrawerDescription>Set up a new recurring tutoring group.</DrawerDescription>

            {formError ? (
              <p
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive mt-4 rounded-md border px-3 py-2 text-sm"
              >
                {formError}
              </p>
            ) : null}

            <div className="mt-6">
              <ClassForm
                values={values}
                onFieldChange={updateField}
                fieldErrors={fieldErrors}
                scheduleErrors={scheduleErrors}
                subjects={subjects}
                teachers={teachers}
                disabled={isPending}
              />
            </div>
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
              Save Class
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
