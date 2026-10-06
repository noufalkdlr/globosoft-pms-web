// These types mirror the JSON returned by the FastAPI backend (snake_case),
// so swapping dummy data for real API calls needs no component changes.

export type UserRole = "admin" | "member";

export interface Team {
  id: number;
  name: string;
  can_create_content: boolean;
  can_assign: boolean;
  can_review: boolean;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  team: Team | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
}
