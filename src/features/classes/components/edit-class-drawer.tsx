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
import { ClassForm } from "@/features/classes/components/class-form";
import {
  classFormSchema,
  flattenClassFormErrors,
  type ClassFormValues,
} from "@/features/classes/schema";
import { updateClass } from "@/features/classes/actions/update-class";
import type { Class, ScheduleSlot, SubjectOption, TeacherOption } from "@/features/classes/types";

function toFormValues(classItem: Class, schedule: ScheduleSlot[]): ClassFormValues {
  return {
    name: classItem.name,
    subjectId: classItem.subject_id,
    newSubjectName: "",
    level: classItem.level ?? "",
    teacherId: classItem.teacher_id ?? "",
    capacity: String(classItem.capacity),
    status: classItem.status,
    schedule,
  };
}

// initialValues is re-derived from props on every render — after a
// successful save, router.refresh() causes the parent page to re-fetch and
// pass updated classItem/schedule props, so the next time this drawer
// opens it's already showing the just-saved data, not stale closure state.
export function EditClassDrawer({
  classItem,
  schedule,
  subjects,
  teachers,
}: {
  classItem: Class;
  schedule: ScheduleSlot[];
  subjects: SubjectOption[];
  teachers: TeacherOption[];
}) {
  const initialValues = toFormValues(classItem, schedule);

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ClassFormValues>(initialValues);
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
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    if (nextOpen) {
      setValues(initialValues);
      setFieldErrors({});
      setScheduleErrors({});
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
        const result = await updateClass(classItem.id, values);

        if (!result.success) {
          setFormError(result.error);
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
          return;
        }

        setOpen(false);
        router.refresh();
        toastManager.add({
          title: "Class updated successfully.",
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
            <DrawerTitle>Edit Class</DrawerTitle>
            <DrawerDescription>Update this class&apos;s details.</DrawerDescription>

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
              Save Changes
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
