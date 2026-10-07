// Mirrors the FastAPI JSON (snake_case)

export interface ContentType {
  id: number;
  name: string;
  // Types are never deleted, only deactivated, so old cards keep their type
  is_active: boolean;
}

export interface ContentTypeCreateRequest {
  name: string;
}

// Only fields that are present change. Admins only.
export interface ContentTypeUpdateRequest {
  name?: string;
  // false = turned off: it can no longer be added to a plan, but cards and
  // plans that already use it keep working
  is_active?: boolean;
}
