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
