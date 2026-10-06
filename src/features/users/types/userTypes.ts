// Mirrors the FastAPI JSON (snake_case)

// A team member who can be given cards, as shown in an "Assign to" dropdown
export interface AssignableUser {
  id: number;
  name: string;
  team: { id: number; name: string };
}
