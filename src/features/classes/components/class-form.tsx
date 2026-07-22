import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ScheduleSlotEditor } from "@/features/classes/components/schedule-slot-editor";
import { NEW_SUBJECT_VALUE, type ClassFormValues } from "@/features/classes/schema";
import type { SubjectOption, TeacherOption } from "@/features/classes/types";

// The field body shared by AddClassDrawer and EditClassDrawer — same
// fields, same validation, different submit target. Each drawer owns its
// own state, error handling, and Server Action call; this component only
// renders inputs and reports changes upward.
export function ClassForm({
  values,
  onFieldChange,
  fieldErrors,
  scheduleErrors,
  subjects,
  teachers,
  disabled,
}: {
  values: ClassFormValues;
  onFieldChange: <K extends keyof ClassFormValues>(field: K, value: ClassFormValues[K]) => void;
  fieldErrors: Record<string, string>;
  scheduleErrors: Record<number, string>;
  subjects: SubjectOption[];
  teachers: TeacherOption[];
  disabled?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-4" disabled={disabled}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">
          Class name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          aria-invalid={!!fieldErrors.name}
          aria-required="true"
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          autoFocus
        />
        {fieldErrors.name ? (
          <p id="name-error" className="text-destructive text-xs">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="subjectId">
          Subject <span className="text-destructive">*</span>
        </Label>
        <Select
          id="subjectId"
          value={values.subjectId}
          onChange={(event) => onFieldChange("subjectId", event.target.value)}
          aria-invalid={!!fieldErrors.subjectId}
          aria-required="true"
        >
          <option value="" disabled>
            Select a subject
          </option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
          <option value={NEW_SUBJECT_VALUE}>+ Add new subject</option>
        </Select>
        {fieldErrors.subjectId ? (
          <p className="text-destructive text-xs">{fieldErrors.subjectId}</p>
        ) : null}
      </div>

      {values.subjectId === NEW_SUBJECT_VALUE ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newSubjectName">
            New subject name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="newSubjectName"
            value={values.newSubjectName}
            onChange={(event) => onFieldChange("newSubjectName", event.target.value)}
            aria-invalid={!!fieldErrors.newSubjectName}
          />
          {fieldErrors.newSubjectName ? (
            <p className="text-destructive text-xs">{fieldErrors.newSubjectName}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="level">
          Level <span className="text-destructive">*</span>
        </Label>
        <Input
          id="level"
          placeholder="e.g. Grade 8, Advanced"
          value={values.level}
          onChange={(event) => onFieldChange("level", event.target.value)}
          aria-invalid={!!fieldErrors.level}
          aria-required="true"
        />
        {fieldErrors.level ? <p className="text-destructive text-xs">{fieldErrors.level}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="teacherId">Teacher</Label>
        <Select
          id="teacherId"
          value={values.teacherId}
          onChange={(event) => onFieldChange("teacherId", event.target.value)}
        >
          <option value="">— No teacher assigned —</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="capacity">
          Capacity <span className="text-destructive">*</span>
        </Label>
        <Input
          id="capacity"
          type="number"
          min={1}
          step={1}
          value={values.capacity}
          onChange={(event) => onFieldChange("capacity", event.target.value)}
          aria-invalid={!!fieldErrors.capacity}
          aria-required="true"
        />
        {fieldErrors.capacity ? (
          <p className="text-destructive text-xs">{fieldErrors.capacity}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          value={values.status}
          onChange={(event) => onFieldChange("status", event.target.value as "active" | "inactive")}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Weekly schedule</Label>
        <ScheduleSlotEditor
          slots={values.schedule}
          onChange={(schedule) => onFieldChange("schedule", schedule)}
          errors={scheduleErrors}
        />
      </div>
    </fieldset>
  );
}
