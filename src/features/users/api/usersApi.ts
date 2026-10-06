import { wait } from "../../../lib/api/dummyHelpers";
import {
  createUser,
  listAssignableUsers,
  listUsers,
  updateUser,
} from "./dummyUsers";

import type { PaginatedResponse } from "../../../types/paginationTypes";
import type {
  AssignableUser,
  UserCreateRequest,
  UserListParams,
  UserRecord,
  UserUpdateRequest,
} from "../types/userTypes";

// DUMMY IMPLEMENTATION. When the FastAPI backend is ready, replace the body
// with the call below and delete dummyUsers.ts.

// const response = await api.get<AssignableUser[]>(USER_ENDPOINTS.assignable);
// return response.data;
export async function listAssignableUsersApi(): Promise<AssignableUser[]> {
  await wait(250);

  return listAssignableUsers();
}

// const response = await api.get<PaginatedResponse<UserRecord>>(USER_ENDPOINTS.list, { params });
// return response.data;
export async function listUsersApi(
  params: UserListParams,
): Promise<PaginatedResponse<UserRecord>> {
  await wait(350);

  return listUsers(params);
}

// const response = await api.post<UserRecord>(USER_ENDPOINTS.create, payload);
// return response.data;
export async function createUserApi(
  payload: UserCreateRequest,
): Promise<UserRecord> {
  await wait(500);

  return createUser(payload);
}

// const response = await api.patch<UserRecord>(USER_ENDPOINTS.detail(id), payload);
// return response.data;
export async function updateUserApi(
  id: number,
  payload: UserUpdateRequest,
): Promise<UserRecord> {
  await wait(500);

  return updateUser(id, payload);
}
