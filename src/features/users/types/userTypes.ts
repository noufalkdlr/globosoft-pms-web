// Mirrors the FastAPI JSON (snake_case)

import type { UserRole } from "../../auth/types/authTypes";

// A team member who can be given cards, as shown in an "Assign to" dropdown
export interface AssignableUser {
  id: number;
  name: string;
  avatar_url: string | null;
  team: { id: number; name: string };
}

// One row of the admin Users screen. `is_active` false means the person was
// deactivated: they cannot sign in, but their account and history are kept.
export interface UserRecord {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  // Admins have no team
  team: { id: number; name: string } | null;
  is_active: boolean;
  created_at: string;
}

export interface UserListParams {
  // Matches part of the name or the email
  search?: string;
  role?: UserRole;
  team_id?: number;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  role: UserRole;
  // Required for members, must be null for admins
  team_id: number | null;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  team_id?: number | null;
  is_active?: boolean;
}
