import { wait } from "../../../lib/api/dummyHelpers";
import { createClient, listClients, updateClient } from "./dummyClients";

import type { PaginatedResponse } from "../../../types/paginationTypes";
import type {
  Client,
  ClientCreateRequest,
  ClientListParams,
  ClientUpdateRequest,
} from "../types/clientTypes";

// DUMMY IMPLEMENTATIONS. When the FastAPI backend is ready, replace each
// body with the call in its comment and delete dummyClients.ts.

// const response = await api.get<PaginatedResponse<Client>>(CLIENT_ENDPOINTS.list, { params });
// return response.data;
export async function listClientsApi(
  params: ClientListParams,
): Promise<PaginatedResponse<Client>> {
  await wait(400);

  return listClients(params);
}

// const response = await api.post<Client>(CLIENT_ENDPOINTS.create, payload);
// return response.data;
export async function createClientApi(
  payload: ClientCreateRequest,
): Promise<Client> {
  await wait(500);

  return createClient(payload);
}

// const response = await api.patch<Client>(CLIENT_ENDPOINTS.detail(id), payload);
// return response.data;
export async function updateClientApi(
  id: number,
  payload: ClientUpdateRequest,
): Promise<Client> {
  await wait(500);

  return updateClient(id, payload);
}
