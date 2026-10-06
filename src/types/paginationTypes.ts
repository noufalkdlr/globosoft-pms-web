// Shape of every list endpoint of the FastAPI backend
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
