import { wait } from "../../../lib/api/dummyHelpers";
import { createContentType, listContentTypes } from "./dummyContentTypes";

import type {
  ContentType,
  ContentTypeCreateRequest,
} from "../types/contentTypeTypes";

// DUMMY IMPLEMENTATIONS. When the FastAPI backend is ready, replace each
// body with the call in its comment and delete dummyContentTypes.ts.

// const response = await api.get<ContentType[]>(CONTENT_TYPE_ENDPOINTS.list);
// return response.data;
export async function listContentTypesApi(): Promise<ContentType[]> {
  await wait(250);

  return listContentTypes();
}

// const response = await api.post<ContentType>(CONTENT_TYPE_ENDPOINTS.create, payload);
// return response.data;
export async function createContentTypeApi(
  payload: ContentTypeCreateRequest,
): Promise<ContentType> {
  await wait(250);

  return createContentType(payload.name);
}
