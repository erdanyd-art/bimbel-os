import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateStudentFormValues } from "@/features/students/schema";

const todayIsoDate = new Date().toISOString().split("T")[0];

// The field body shared by AddStudentDrawer and EditStudentDrawer — same
// fields, same validation, different submit target.
export function StudentForm({
  values,
  onFieldChange,
  fieldErrors,
  disabled,
  autoFocusFirstField = true,
}: {
  values: CreateStudentFormValues;
  onFieldChange: (field: keyof CreateStudentFormValues, value: string) => void;
  fieldErrors: Record<string, string>;
  disabled?: boolean;
  autoFocusFirstField?: boolean;
}) {
  return (
    <>
      <fieldset className="mt-6 flex flex-col gap-4" disabled={disabled}>
        <legend className="text-tertiary text-xs font-semibold tracking-wide uppercase">
          Student
        </legend>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            autoFocus={autoFocusFirstField}
            value={values.fullName}
            onChange={(event) => onFieldChange("fullName", event.target.value)}
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
            onChange={(event) => onFieldChange("gradeLevel", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            max={todayIsoDate}
            value={values.dateOfBirth}
            onChange={(event) => onFieldChange("dateOfBirth", event.target.value)}
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

      <fieldset className="mt-6 flex flex-col gap-4" disabled={disabled}>
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
            onChange={(event) => onFieldChange("parentName", event.target.value)}
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
            onChange={(event) => onFieldChange("parentPhone", event.target.value)}
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
            onChange={(event) => onFieldChange("parentEmail", event.target.value)}
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
    </>
  );
}
