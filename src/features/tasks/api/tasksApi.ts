import { wait } from "../../../lib/api/dummyHelpers";
import {
  changeTaskStatus,
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from "./dummyTasks";

import type { PaginatedResponse } from "../../../types/paginationTypes";
import type {
  Task,
  TaskCreateRequest,
  TaskListParams,
  TaskStatusChangeRequest,
  TaskUpdateRequest,
} from "../types/taskTypes";

// DUMMY IMPLEMENTATIONS. When the FastAPI backend is ready, replace each
// body with the call in its comment and delete dummyTasks.ts.

// const response = await api.get<PaginatedResponse<Task>>(TASK_ENDPOINTS.list, { params });
// return response.data;
export async function listTasksApi(
  params: TaskListParams,
): Promise<PaginatedResponse<Task>> {
  await wait(400);

  return listTasks(params);
}

// const response = await api.post<Task>(TASK_ENDPOINTS.create, payload);
// return response.data;
export async function createTaskApi(payload: TaskCreateRequest): Promise<Task> {
  await wait(400);

  return createTask(payload);
}

// const response = await api.patch<Task>(TASK_ENDPOINTS.detail(id), payload);
// return response.data;
export async function updateTaskApi(
  id: number,
  payload: TaskUpdateRequest,
): Promise<Task> {
  await wait(400);

  return updateTask(id, payload);
}

// await api.delete(TASK_ENDPOINTS.detail(id));
export async function deleteTaskApi(id: number): Promise<void> {
  await wait(400);

  deleteTask(id);
}

// const response = await api.patch<Task>(TASK_ENDPOINTS.status(id), payload);
// return response.data;
export async function changeTaskStatusApi(
  id: number,
  payload: TaskStatusChangeRequest,
): Promise<Task> {
  await wait(400);

  return changeTaskStatus(id, payload);
}
