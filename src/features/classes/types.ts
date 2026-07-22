export type ClassStatus = "active" | "inactive";

export type Class = {
  id: string;
  name: string;
  subject_id: string;
  subject_name: string | null;
  level: string | null;
  teacher_id: string | null;
  teacher_name: string | null;
  capacity: number;
  status: ClassStatus;
  schedule_summary: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubjectOption = {
  id: string;
  name: string;
};

export type TeacherOption = {
  id: string;
  name: string;
};

export type ScheduleSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};
