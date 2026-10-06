// These types mirror the JSON returned by the FastAPI backend (snake_case),
// so swapping dummy data for real API calls needs no component changes.

export type UserRole = "admin" | "member";

export interface Team {
  id: number;
  name: string;
  can_manage_clients: boolean;
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

// `credential` is the ID token (a JWT) that Google hands to the frontend
// after the user picks an account. The backend verifies it with Google.
export interface GoogleLoginRequest {
  credential: string;
}

export interface LoginResponse {
  user: AuthUser;
}
