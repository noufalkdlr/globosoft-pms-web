import { demoStorageKey } from "../../../config/demoData";
import { fakeApiError } from "../../../lib/api/dummyHelpers";
import { can } from "../../../lib/permissions";
import { readSession } from "../../auth/api/dummySession";

import type { AuthUser } from "../../auth/types/authTypes";
import type {
  ContentType,
  ContentTypeUpdateRequest,
} from "../types/contentTypeTypes";

// TEMPORARY: stands in for the content_types table of the FastAPI backend.
// Delete this file once the real API is connected.

// The six everyday types are kept in the empty start too: they are settings, not
// sample data, and a client plan needs them
const STORAGE_KEY = demoStorageKey("content-types");
const MAX_NAME_LENGTH = 40;

interface State {
  types: ContentType[];
  nextId: number;
}

const SEED_NAMES = ["Poster", "Reel", "Story", "Carousel", "Video", "3D"];

let state: State | null = null;

function load(): State {
  if (state) {
    return state;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      state = JSON.parse(raw) as State;
      return state;
    }
  } catch {
    // Unreadable or unavailable storage: start from the seed data
  }

  state = {
    types: SEED_NAMES.map((name, index) => ({
      id: index + 1,
      name,
      is_active: true,
    })),
    nextId: SEED_NAMES.length + 1,
  };

  return state;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: changes just will not survive a reload
  }
}

// Trim and collapse inner spaces so "  Story   Reel " is stored as "Story Reel"
function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function requireUser(): AuthUser {
  const user = readSession();

  if (!user) {
    throw fakeApiError(401, "Not authenticated");
  }

  return user;
}

// The list as the app's other dummy files read it, without a session check
export function listContentTypes(): ContentType[] {
  return load().types.map((type) => ({ ...type }));
}

// GET /content-types: any signed-in user
export function listContentTypesForUser(): ContentType[] {
  requireUser();

  return listContentTypes();
}

export function findContentType(id: number): ContentType | undefined {
  const type = load().types.find((item) => item.id === id);

  return type ? { ...type } : undefined;
}

// A name ready to store: tidied, not empty, not too long, and not taken by
// another type ("Poster" and "poster" must never both exist, or reports would
// split in two). `ignoreId` lets a type keep, or re-case, its own name.
function validateName(name: string, ignoreId?: number) {
  const normalized = normalizeName(name);

  if (!normalized) {
    throw fakeApiError(422, "Enter a name for the content type.");
  }

  if (normalized.length > MAX_NAME_LENGTH) {
    throw fakeApiError(
      422,
      `Use ${MAX_NAME_LENGTH} characters or fewer for the name.`,
    );
  }

  const exists = load().types.some(
    (type) =>
      type.id !== ignoreId &&
      type.name.toLowerCase() === normalized.toLowerCase(),
  );

  if (exists) {
    throw fakeApiError(409, "That content type already exists.");
  }

  return normalized;
}

export function createContentType(name: string): ContentType {
  const user = requireUser();

  if (!can(user, "can_manage_clients")) {
    throw fakeApiError(403, "You don't have permission to add content types.");
  }

  const current = load();
  const normalized = validateName(name);

  const created: ContentType = {
    id: current.nextId,
    name: normalized,
    is_active: true,
  };

  current.types.push(created);
  current.nextId += 1;
  save();

  return { ...created };
}

// PATCH /content-types/{id}: rename a type, or turn it off and on. Admins only.
// Types are never deleted: old cards and plans keep pointing at them.
export function updateContentType(
  id: number,
  request: ContentTypeUpdateRequest,
): ContentType {
  const user = requireUser();

  if (user.role !== "admin") {
    throw fakeApiError(403, "Only admins can change content types.");
  }

  const type = load().types.find((item) => item.id === id);

  if (!type) {
    throw fakeApiError(404, "Content type not found.");
  }

  // Validate everything before changing anything
  const name =
    request.name !== undefined ? validateName(request.name, id) : type.name;

  if (request.is_active !== undefined && typeof request.is_active !== "boolean") {
    throw fakeApiError(422, "is_active must be true or false.");
  }

  type.name = name;
  type.is_active = request.is_active ?? type.is_active;
  save();

  return { ...type };
}
