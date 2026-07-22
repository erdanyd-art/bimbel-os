import { z } from "zod";

// Sentinel picked in the Subject <select> to mean "create a new subject
// with the typed name" rather than referencing an existing subjects row.
export const NEW_SUBJECT_VALUE = "__new__";

const scheduleSlotSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine((slot) => slot.endTime > slot.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

// Shared between the client form (inline validation) and the create/update
// Server Actions (defense in depth) — same pattern as students/schema.ts.
export const classFormSchema = z
  .object({
    name: z.string().trim().min(1, "Class name is required"),
    subjectId: z.string().min(1, "Subject is required"),
    newSubjectName: z.string().trim(),
    level: z.string().trim().min(1, "Level is required"),
    teacherId: z.string(),
    capacity: z
      .string()
      .trim()
      .min(1, "Capacity is required")
      .refine(
        (value) => Number.isInteger(Number(value)) && Number(value) > 0,
        "Enter a whole number greater than 0",
      ),
    status: z.enum(["active", "inactive"]),
    schedule: z.array(scheduleSlotSchema),
  })
  .superRefine((data, ctx) => {
    if (data.subjectId === NEW_SUBJECT_VALUE && data.newSubjectName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New subject name is required",
        path: ["newSubjectName"],
      });
    }
  })
  .transform((data) => ({
    name: data.name,
    subjectId: data.subjectId === NEW_SUBJECT_VALUE ? null : data.subjectId,
    newSubjectName: data.subjectId === NEW_SUBJECT_VALUE ? data.newSubjectName.trim() : null,
    level: data.level,
    teacherId: data.teacherId || null,
    capacity: Number(data.capacity),
    status: data.status,
    schedule: data.schedule,
  }));

export type ClassFormValues = {
  name: string;
  subjectId: string;
  newSubjectName: string;
  level: string;
  teacherId: string;
  capacity: string;
  status: "active" | "inactive";
  schedule: { dayOfWeek: number; startTime: string; endTime: string }[];
};

export type ClassFormInput = z.infer<typeof classFormSchema>;

// Splits a ZodError into top-level field errors and per-slot schedule
// errors — schedule is an array, so a plain path[0] flatten (the pattern
// used everywhere else in this codebase) would collapse every slot's error
// under one generic "schedule" key instead of pointing at which slot.
export function flattenClassFormErrors(error: z.ZodError): {
  fieldErrors: Record<string, string>;
  scheduleErrors: Record<number, string>;
} {
  const fieldErrors: Record<string, string> = {};
  const scheduleErrors: Record<number, string> = {};

  for (const issue of error.issues) {
    const [first, second] = issue.path;
    if (first === "schedule" && typeof second === "number") {
      if (scheduleErrors[second] === undefined) {
        scheduleErrors[second] = issue.message;
      }
    } else if (typeof first === "string" && fieldErrors[first] === undefined) {
      fieldErrors[first] = issue.message;
    }
  }

  return { fieldErrors, scheduleErrors };
}
