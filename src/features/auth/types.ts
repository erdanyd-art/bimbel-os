export type Role = "owner" | "admin" | "teacher";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};
