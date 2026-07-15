import { z } from "zod";

// Shared between the client form (inline validation, before submit) and the
// create-student Server Action (defense in depth — client validation is
// never trusted alone). Fields map 1:1 to real columns on public.students;
// nothing here that doesn't already exist in the schema.
export const createStudentSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required"),
    gradeLevel: z.string().trim(),
    dateOfBirth: z
      .string()
      .refine(
        (value) => value === "" || new Date(value) <= new Date(),
        "Date of birth can't be in the future",
      ),
    parentName: z.string().trim().min(1, "Parent name is required"),
    parentPhone: z
      .string()
      .trim()
      .min(1, "Parent phone is required")
      .regex(/^[0-9+\-\s()]{8,20}$/, "Enter a valid phone number"),
    parentEmail: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        "Enter a valid email address",
      ),
  })
  .transform((data) => ({
    fullName: data.fullName,
    gradeLevel: data.gradeLevel || null,
    dateOfBirth: data.dateOfBirth || null,
    parentName: data.parentName,
    parentPhone: data.parentPhone,
    parentEmail: data.parentEmail || null,
  }));

export type CreateStudentFormValues = {
  fullName: string;
  gradeLevel: string;
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
};

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
