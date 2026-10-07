import { wait } from "../../../lib/api/dummyHelpers";
import { renameCardTitles } from "../../tasks/api/dummyTasks";
import {
  createContentType,
  findContentType,
  listContentTypesForUser,
  updateContentType,
} from "./dummyContentTypes";

import type {
  ContentType,
  ContentTypeCreateRequest,
  ContentTypeUpdateRequest,
} from "../types/contentTypeTypes";

// DUMMY IMPLEMENTATIONS. When the FastAPI backend is ready, replace each
// body with the call in its comment and delete dummyContentTypes.ts.

// const response = await api.get<ContentType[]>(CONTENT_TYPE_ENDPOINTS.list);
// return response.data;
export async function listContentTypesApi(): Promise<ContentType[]> {
  await wait(250);

  return listContentTypesForUser();
}

// const response = await api.post<ContentType>(CONTENT_TYPE_ENDPOINTS.create, payload);
// return response.data;
export async function createContentTypeApi(
  payload: ContentTypeCreateRequest,
): Promise<ContentType> {
  await wait(250);

  return createContentType(payload.name);
}

// const response = await api.patch<ContentType>(CONTENT_TYPE_ENDPOINTS.detail(id), payload);
// return response.data;
export async function updateContentTypeApi(
  id: number,
  payload: ContentTypeUpdateRequest,
): Promise<ContentType> {
  await wait(250);

  const previousName = findContentType(id)?.name;
  const updated = updateContentType(id, payload);

  // The real backend renames the cards in the same transaction
  if (previousName && updated.name !== previousName) {
    renameCardTitles(id, previousName, updated.name);
  }

  return updated;
}
