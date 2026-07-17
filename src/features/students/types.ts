export type StudentStatus = "active" | "inactive";

export type Student = {
  id: string;
  full_name: string;
  grade_level: string | null;
  date_of_birth: string | null;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  status: StudentStatus;
  active_class_names: string | null;
  created_at: string;
  updated_at: string;
};
