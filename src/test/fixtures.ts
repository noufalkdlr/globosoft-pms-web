import type { Task } from "../features/tasks/types/taskTypes";

// A card with everything filled in; a test changes only what it is about
export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    client: { id: 1, name: "Fresh Bakes" },
    content_type: { id: 1, name: "Poster", is_active: true },
    month: "2026-11",
    title: "Poster 1",
    content: "",
    notes: "",
    status: "todo",
    created_by: { id: 2, name: "Marketing Demo", avatar_url: null },
    assigned_to: null,
    file_link: null,
    latest_review: null,
    posting_date: null,
    deadline: null,
    created_at: "2026-10-06T09:00:00Z",
    updated_at: "2026-10-06T09:00:00Z",
    actions: { can_edit: false, can_delete: false, can_assign: false, moves: [] },
    ...overrides,
  };
}

export function person(id: number, name: string) {
  return { id, name, avatar_url: null };
}
