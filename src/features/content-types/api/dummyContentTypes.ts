import { fakeApiError } from "../../../lib/api/dummyHelpers";

import type { ContentType } from "../types/contentTypeTypes";

// TEMPORARY: stands in for the content_types table of the FastAPI backend.
// Delete this file once the real API is connected.

const STORAGE_KEY = "pms-dummy-content-types";
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

export function listContentTypes(): ContentType[] {
  return load().types.map((type) => ({ ...type }));
}

export function findContentType(id: number): ContentType | undefined {
  const type = load().types.find((item) => item.id === id);

  return type ? { ...type } : undefined;
}

export function createContentType(name: string): ContentType {
  const current = load();
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

  // "Poster" and "poster" must never both exist, or reports would split in two
  const exists = current.types.some(
    (type) => type.name.toLowerCase() === normalized.toLowerCase(),
  );

  if (exists) {
    throw fakeApiError(409, "That content type already exists.");
  }

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
