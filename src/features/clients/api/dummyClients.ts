import { DEMO_DATA_MODE, demoStorageKey } from "../../../config/demoData";
import { fakeApiError } from "../../../lib/api/dummyHelpers";
import { getCurrentMonth, isValidMonth } from "../../../utils/month";
import { findContentType } from "../../content-types/api/dummyContentTypes";

import type { PaginatedResponse } from "../../../types/paginationTypes";
import type {
  Client,
  ClientCreateRequest,
  ClientListParams,
  ClientPlanChange,
  ClientUpdateRequest,
  PlanItem,
} from "../types/clientTypes";

// TEMPORARY: stands in for the clients and client_plan_items tables of the
// FastAPI backend. Delete this file once the real API is connected.
//
// A client's plan is stored as history rows ("from month X, type T has count N")
// and never as a single editable number. The plan for any month is derived
// from those rows, so changing the budget from December leaves earlier
// months, and the reports built on them, exactly as they were.

const STORAGE_KEY = demoStorageKey("clients");
const MAX_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;
const MAX_COUNT = 999;
const SEED_MONTH = "2026-01";

interface ClientRow {
  id: number;
  name: string;
  notes: string | null;
  is_archived: boolean;
}

interface PlanRow {
  client_id: number;
  content_type_id: number;
  count: number;
  effective_from_month: string;
}

interface State {
  clients: ClientRow[];
  planRows: PlanRow[];
  nextClientId: number;
}

// Content type ids follow the seed list in dummyContentTypes.ts:
// 1 Poster, 2 Reel, 3 Story, 4 Carousel, 5 Video, 6 3D
function buildSeed(): State {
  // The empty start: no clients yet
  if (DEMO_DATA_MODE === "empty") {
    return { clients: [], planRows: [], nextClientId: 1 };
  }

  const clients: ClientRow[] = [
    {
      id: 1,
      name: "Fresh Bakes",
      notes: "Bakery chain with three outlets in Kochi.",
      is_archived: false,
    },
    { id: 2, name: "Urban Gym", notes: null, is_archived: false },
    {
      id: 3,
      name: "Kerala Spice",
      notes: "Restaurant. Festival campaigns need extra lead time.",
      is_archived: false,
    },
    { id: 4, name: "Dental Care", notes: null, is_archived: false },
    { id: 5, name: "Auto Hub", notes: null, is_archived: false },
    {
      id: 6,
      name: "Old Client Co",
      notes: "Contract ended in September.",
      is_archived: true,
    },
  ];

  const plans: Array<[number, Array<[number, number]>]> = [
    [1, [[1, 12], [2, 4]]],
    [2, [[1, 10], [3, 8]]],
    [3, [[1, 8], [5, 2]]],
    [4, [[1, 8]]],
    [5, [[1, 6], [6, 2]]],
    [6, [[1, 4]]],
  ];

  const planRows = plans.flatMap(([clientId, items]) =>
    items.map(([contentTypeId, count]) => ({
      client_id: clientId,
      content_type_id: contentTypeId,
      count,
      effective_from_month: SEED_MONTH,
    })),
  );

  return { clients, planRows, nextClientId: clients.length + 1 };
}

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

  state = buildSeed();

  return state;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: changes just will not survive a reload
  }
}

// The plan in force for `month`: for every content type, the latest history
// row that starts on or before that month. A count of 0 means "ended".
export function getPlanForMonth(clientId: number, month: string): PlanItem[] {
  const latestByType = new Map<number, PlanRow>();

  for (const row of load().planRows) {
    if (row.client_id !== clientId || row.effective_from_month > month) {
      continue;
    }

    const latest = latestByType.get(row.content_type_id);

    if (!latest || row.effective_from_month >= latest.effective_from_month) {
      latestByType.set(row.content_type_id, row);
    }
  }

  const items: PlanItem[] = [];

  for (const row of latestByType.values()) {
    const contentType = findContentType(row.content_type_id);

    if (row.count > 0 && contentType) {
      items.push({ content_type: contentType, count: row.count });
    }
  }

  return items.sort((a, b) => a.content_type.id - b.content_type.id);
}

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    is_archived: row.is_archived,
    current_plan: getPlanForMonth(row.id, getCurrentMonth()),
  };
}

function cleanName(name: string) {
  const cleaned = name.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    throw fakeApiError(422, "Enter the client's name.");
  }

  if (cleaned.length > MAX_NAME_LENGTH) {
    throw fakeApiError(
      422,
      `Use ${MAX_NAME_LENGTH} characters or fewer for the name.`,
    );
  }

  return cleaned;
}

function cleanNotes(notes: string | null | undefined) {
  const cleaned = notes?.trim() ?? "";

  if (cleaned.length > MAX_NOTES_LENGTH) {
    throw fakeApiError(
      422,
      `Use ${MAX_NOTES_LENGTH} characters or fewer for the notes.`,
    );
  }

  return cleaned || null;
}

// Archived clients count too: reusing a name would make old reports ambiguous
function assertNameIsFree(name: string, ignoreId?: number) {
  const taken = load().clients.some(
    (client) =>
      client.id !== ignoreId &&
      client.name.toLowerCase() === name.toLowerCase(),
  );

  if (taken) {
    throw fakeApiError(409, "A client with this name already exists.");
  }
}

function validatePlan(change: ClientPlanChange) {
  if (!isValidMonth(change.effective_from_month)) {
    throw fakeApiError(422, "Enter the plan's start month as YYYY-MM.");
  }

  // Starting a plan in the past would silently rewrite finished months
  if (change.effective_from_month < getCurrentMonth()) {
    throw fakeApiError(
      422,
      "A plan change can only start this month or later.",
    );
  }

  const seen = new Set<number>();

  for (const item of change.items) {
    const contentType = findContentType(item.content_type_id);

    if (!contentType || !contentType.is_active) {
      throw fakeApiError(422, "Choose an active content type.");
    }

    if (
      !Number.isInteger(item.count) ||
      item.count < 1 ||
      item.count > MAX_COUNT
    ) {
      throw fakeApiError(422, `Enter a count between 1 and ${MAX_COUNT}.`);
    }

    if (seen.has(item.content_type_id)) {
      throw fakeApiError(
        422,
        "Each content type can appear only once in a plan.",
      );
    }

    seen.add(item.content_type_id);
  }
}

// Call only after validatePlan: this mutates the state
function applyPlan(clientId: number, change: ClientPlanChange) {
  const current = load();
  const month = change.effective_from_month;

  // What was in force on that month before this change
  const previouslyInForce = getPlanForMonth(clientId, month);

  // Saving twice for the same month replaces the first save
  current.planRows = current.planRows.filter(
    (row) =>
      !(row.client_id === clientId && row.effective_from_month === month),
  );

  const submittedTypeIds = new Set<number>();

  for (const item of change.items) {
    submittedTypeIds.add(item.content_type_id);
    current.planRows.push({
      client_id: clientId,
      content_type_id: item.content_type_id,
      count: item.count,
      effective_from_month: month,
    });
  }

  // A type that was in force but is no longer listed ends from this month
  for (const previous of previouslyInForce) {
    if (!submittedTypeIds.has(previous.content_type.id)) {
      current.planRows.push({
        client_id: clientId,
        content_type_id: previous.content_type.id,
        count: 0,
        effective_from_month: month,
      });
    }
  }
}

export function listClients(
  params: ClientListParams = {},
): PaginatedResponse<Client> {
  const { search = "", is_archived = false, limit = 50, offset = 0 } = params;
  const needle = search.trim().toLowerCase();

  const matches = load()
    .clients.filter(
      (client) =>
        client.is_archived === is_archived &&
        (!needle || client.name.toLowerCase().includes(needle)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    items: matches.slice(offset, offset + limit).map(toClient),
    total: matches.length,
    limit,
    offset,
  };
}

export function createClient(request: ClientCreateRequest): Client {
  const current = load();

  // Validate everything before changing anything
  const name = cleanName(request.name);
  const notes = cleanNotes(request.notes);
  assertNameIsFree(name);

  if (request.plan) {
    validatePlan(request.plan);
  }

  const row: ClientRow = {
    id: current.nextClientId,
    name,
    notes,
    is_archived: false,
  };

  current.clients.push(row);
  current.nextClientId += 1;

  if (request.plan) {
    applyPlan(row.id, request.plan);
  }

  save();

  return toClient(row);
}

export function updateClient(id: number, request: ClientUpdateRequest): Client {
  const row = load().clients.find((client) => client.id === id);

  if (!row) {
    throw fakeApiError(404, "Client not found.");
  }

  // Validate everything before changing anything
  const name = request.name !== undefined ? cleanName(request.name) : undefined;
  const notes =
    request.notes !== undefined ? cleanNotes(request.notes) : undefined;

  if (name !== undefined) {
    assertNameIsFree(name, id);
  }

  if (request.plan) {
    validatePlan(request.plan);
  }

  if (name !== undefined) {
    row.name = name;
  }

  if (notes !== undefined) {
    row.notes = notes;
  }

  if (request.is_archived !== undefined) {
    row.is_archived = request.is_archived;
  }

  if (request.plan) {
    applyPlan(id, request.plan);
  }

  save();

  return toClient(row);
}

// Minimal client info for other dummy modules (tasks, overview)
export interface ClientSummary {
  id: number;
  name: string;
  is_archived: boolean;
}

export function findClientRow(id: number): ClientSummary | undefined {
  const row = load().clients.find((client) => client.id === id);

  return row
    ? { id: row.id, name: row.name, is_archived: row.is_archived }
    : undefined;
}

export function listClientRows(): ClientSummary[] {
  return load().clients.map((row) => ({
    id: row.id,
    name: row.name,
    is_archived: row.is_archived,
  }));
}
