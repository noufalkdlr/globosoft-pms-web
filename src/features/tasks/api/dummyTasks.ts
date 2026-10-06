import { fakeApiError } from "../../../lib/api/dummyHelpers";
import { can } from "../../../lib/permissions";
import { isValidIsoDate } from "../../../utils/date";
import { addMonths, getCurrentMonth, isValidMonth } from "../../../utils/month";
import { readSession } from "../../auth/api/dummyAuth";
import {
  findClientRow,
  getPlanForMonth,
  listClientRows,
} from "../../clients/api/dummyClients";
import { findContentType } from "../../content-types/api/dummyContentTypes";
import {
  findAssignableUser,
  findUser,
} from "../../users/api/dummyUsers";

import { STATUS_LABEL } from "../lib/taskStatus";
import { canMove, getMoveRule } from "../lib/taskRules";

import type { AuthUser } from "../../auth/types/authTypes";
import type {
  ClientMonthOverview,
  ProgressNumbers,
  TypeProgress,
} from "../../calendar/types/overviewTypes";
import type { PaginatedResponse } from "../../../types/paginationTypes";
import type {
  Task,
  TaskCreateRequest,
  TaskListParams,
  TaskPerson,
  TaskReview,
  TaskStatus,
  TaskStatusChangeRequest,
  TaskUpdateRequest,
} from "../types/taskTypes";

// TEMPORARY: stands in for the tasks table of the FastAPI backend, including
// the permission and validation rules the backend must enforce. Delete this
// file once the real API is connected. It reads the signed-in user from the
// dummy session, the way the backend will read it from the session cookie.

const STORAGE_KEY = "pms-dummy-tasks";
const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 5000;
const MAX_MONTHS_AHEAD = 24;

interface ReviewRow {
  id: number;
  decision: "approved" | "rejected";
  comment: string | null;
  reviewer_id: number;
  created_at: string;
}

interface TaskRow {
  id: number;
  client_id: number;
  content_type_id: number;
  month: string;
  title: string;
  content: string;
  status: TaskStatus;
  created_by_id: number;
  assigned_to_id: number | null;
  file_link: string | null;
  posting_date: string | null;
  deadline: string | null;
  // Oldest first
  reviews: ReviewRow[];
  created_at: string;
  updated_at: string;
}

interface State {
  tasks: TaskRow[];
  nextId: number;
  nextReviewId: number;
}

// ---- seed data -----------------------------------------------------------
// Built around the real current month so the demo always looks alive:
// this month is mostly written and in progress, next month is just starting.

const TITLE_IDEAS = [
  "Festive offer",
  "Behind the scenes",
  "Weekend combo",
  "New arrival",
  "Customer story",
  "Tips and tricks",
  "Team spotlight",
  "Limited offer",
  "Product highlight",
  "Seasonal special",
  "Quick recipe",
  "Announcement",
];

const MARKETING_USER_ID = 2;
const WORKER_IDS = [11, 12, 3, 13];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function buildSeed(): State {
  const month = getCurrentMonth();
  const nextMonth = addMonths(month, 1);
  const now = new Date().toISOString();
  const previousMonth = addMonths(month, -1);
  const tasks: TaskRow[] = [];
  const counters = new Map<string, number>();
  let nextId = 1;
  let nextReviewId = 1;

  function addCards(
    clientId: number,
    contentTypeId: number,
    targetMonth: string,
    statuses: TaskStatus[],
  ) {
    const typeName = findContentType(contentTypeId)?.name ?? "Post";

    // Continue the numbering of earlier batches for the same client, month and
    // type, so every title in a client's month is unique
    const batchKey = `${clientId}-${targetMonth}-${contentTypeId}`;
    const alreadyAdded = counters.get(batchKey) ?? 0;
    counters.set(batchKey, alreadyAdded + statuses.length);

    statuses.forEach((status, index) => {
      const id = nextId++;
      const deadlineDay = 8 + ((id * 3) % 16);
      const hasDesigner = status !== "new";
      const hasFile =
        status === "submitted" || status === "done" || status === "fix";

      // Cards that were reviewed carry their review: approved when done, a
      // rejection with a comment when sent back for correction
      const reviews: ReviewRow[] = [];

      if (status === "done") {
        reviews.push({
          id: nextReviewId++,
          decision: "approved",
          comment: null,
          reviewer_id: MARKETING_USER_ID,
          created_at: now,
        });
      } else if (status === "fix") {
        reviews.push({
          id: nextReviewId++,
          decision: "rejected",
          comment: "Please make the logo bigger and fix the offer text.",
          reviewer_id: MARKETING_USER_ID,
          created_at: now,
        });
      }

      tasks.push({
        id,
        client_id: clientId,
        content_type_id: contentTypeId,
        month: targetMonth,
        title: `${TITLE_IDEAS[(id + index) % TITLE_IDEAS.length]} ${typeName.toLowerCase()} ${alreadyAdded + index + 1}`,
        content:
          "Caption and talking points for this piece, written by the content team.",
        status,
        created_by_id: MARKETING_USER_ID,
        assigned_to_id: hasDesigner ? WORKER_IDS[id % WORKER_IDS.length] : null,
        file_link: hasFile ? `https://drive.example.com/file/${id}` : null,
        posting_date: status === "new" ? null : `${targetMonth}-${pad(deadlineDay + 2)}`,
        deadline: `${targetMonth}-${pad(deadlineDay)}`,
        reviews,
        created_at: now,
        updated_at: now,
      });
    });
  }

  const repeat = (status: TaskStatus, times: number) =>
    Array.from({ length: times }, () => status);

  // Content type ids: 1 Poster, 2 Reel, 3 Story, 4 Carousel, 5 Video, 6 3D
  // Client ids: 1 Fresh Bakes, 2 Urban Gym, 3 Kerala Spice, 4 Dental Care, 5 Auto Hub

  // Fresh Bakes: 8 of 12 posters written, 5 done (the example in the docs)
  addCards(1, 1, month, [...repeat("done", 5), "ongoing", "todo", "new"]);
  addCards(1, 2, month, ["submitted", "fix"]);
  addCards(1, 1, nextMonth, ["new", "new", "todo"]);

  // Urban Gym: fully written this month, next month half planned
  addCards(2, 1, month, [...repeat("done", 6), ...repeat("submitted", 2), ...repeat("ongoing", 2)]);
  addCards(2, 3, month, [...repeat("done", 3), ...repeat("todo", 5)]);
  addCards(2, 1, nextMonth, [...repeat("new", 6), ...repeat("todo", 4)]);
  addCards(2, 3, nextMonth, repeat("new", 4));

  // Kerala Spice: behind
  addCards(3, 1, month, ["done", "done", "ongoing", "ongoing"]);

  // Dental Care
  addCards(4, 1, month, ["done", "submitted", "ongoing", "todo", "new"]);

  // Work left over from last month: shows as "late" on the board
  addCards(3, 1, previousMonth, ["done", "ongoing", "fix"]);
  addCards(4, 1, previousMonth, ["done", "todo"]);

  // Auto Hub: posters done, one 3D in progress
  addCards(5, 1, month, repeat("done", 6));
  addCards(5, 6, month, ["ongoing"]);

  return { tasks, nextId, nextReviewId };
}

let state: State | null = null;

function load(): State {
  if (state) {
    return state;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const saved = JSON.parse(raw) as State;

      // Data saved before reviews existed: fill in what is missing
      saved.nextReviewId ??= 1;
      saved.tasks.forEach((row) => {
        row.reviews ??= [];
      });

      state = saved;
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

// ---- helpers -------------------------------------------------------------

function requireUser(): AuthUser {
  const user = readSession();

  if (!user) {
    throw fakeApiError(401, "Not authenticated");
  }

  return user;
}

// A member sees the cards assigned to them or written by them. People who can
// assign or review work, and admins, see everything.
function canSee(user: AuthUser, row: TaskRow): boolean {
  return (
    can(user, "can_assign") ||
    can(user, "can_review") ||
    row.assigned_to_id === user.id ||
    row.created_by_id === user.id
  );
}

function toPerson(userId: number): TaskPerson {
  const user = findUser(userId);

  return { id: userId, name: user?.name ?? "Unknown user" };
}

function toReview(row: ReviewRow): TaskReview {
  return {
    id: row.id,
    decision: row.decision,
    comment: row.comment,
    reviewer: toPerson(row.reviewer_id),
    created_at: row.created_at,
  };
}

// A new modification time that is always later than the previous one, even
// when two changes land in the same millisecond. Clients use it to notice that
// a card changed under them.
function nextTimestamp(previous: string) {
  const now = new Date().toISOString();

  return now > previous ? now : new Date(Date.parse(previous) + 1).toISOString();
}

function toTask(row: TaskRow): Task {
  const client = findClientRow(row.client_id);
  const contentType = findContentType(row.content_type_id);

  if (!client || !contentType) {
    throw new Error(`Card ${row.id} points to a missing client or content type`);
  }

  return {
    id: row.id,
    client: { id: client.id, name: client.name },
    content_type: contentType,
    month: row.month,
    title: row.title,
    content: row.content,
    status: row.status,
    created_by: toPerson(row.created_by_id),
    assigned_to: row.assigned_to_id === null ? null : toPerson(row.assigned_to_id),
    file_link: row.file_link,
    latest_review: row.reviews.length > 0 ? toReview(row.reviews[row.reviews.length - 1]) : null,
    posting_date: row.posting_date,
    deadline: row.deadline,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function cleanTitle(title: string) {
  const cleaned = title.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    throw fakeApiError(422, "Enter a title for the card.");
  }

  if (cleaned.length > MAX_TITLE_LENGTH) {
    throw fakeApiError(
      422,
      `Use ${MAX_TITLE_LENGTH} characters or fewer for the title.`,
    );
  }

  return cleaned;
}

function cleanContent(content: string) {
  const cleaned = content.trim();

  if (cleaned.length > MAX_CONTENT_LENGTH) {
    throw fakeApiError(
      422,
      `Use ${MAX_CONTENT_LENGTH} characters or fewer for the content.`,
    );
  }

  return cleaned;
}

function validateMonth(month: string) {
  if (!isValidMonth(month)) {
    throw fakeApiError(422, "Enter the month as YYYY-MM.");
  }

  const current = getCurrentMonth();

  if (month < current) {
    throw fakeApiError(422, "Cards can only be written for this month or later.");
  }

  if (month > addMonths(current, MAX_MONTHS_AHEAD)) {
    throw fakeApiError(422, "That month is too far ahead.");
  }
}

function validateDates(postingDate: string | null, deadline: string | null) {
  for (const value of [postingDate, deadline]) {
    if (value !== null && !isValidIsoDate(value)) {
      throw fakeApiError(422, "Enter dates as YYYY-MM-DD.");
    }
  }

  // ISO dates compare correctly as plain strings
  if (postingDate !== null && deadline !== null && deadline > postingDate) {
    throw fakeApiError(422, "The deadline can't be after the posting date.");
  }
}

// A card's type must be one of the client's plan types for that month. The
// dropdown only offers those, and this keeps the data consistent if anything
// else calls the API.
function validateContentType(clientId: number, month: string, contentTypeId: number) {
  const contentType = findContentType(contentTypeId);

  if (!contentType || !contentType.is_active) {
    throw fakeApiError(422, "Choose an active content type.");
  }

  const inPlan = getPlanForMonth(clientId, month).some(
    (item) => item.content_type.id === contentTypeId,
  );

  if (!inPlan) {
    throw fakeApiError(
      422,
      "That content type isn't in this client's plan for the month. Add it to the plan first.",
    );
  }
}

function validateAssignee(userId: number) {
  if (!findAssignableUser(userId)) {
    throw fakeApiError(422, "Choose a team member who can take cards.");
  }
}

function byDeadline(a: TaskRow, b: TaskRow) {
  if (a.deadline !== b.deadline) {
    // Cards without a deadline go last
    if (a.deadline === null) return 1;
    if (b.deadline === null) return -1;

    return a.deadline < b.deadline ? -1 : 1;
  }

  return a.id - b.id;
}

// ---- operations ----------------------------------------------------------

export function listTasks(params: TaskListParams = {}): PaginatedResponse<Task> {
  const user = requireUser();
  const {
    month,
    client_id,
    assigned_to,
    status,
    include_late = false,
    limit = 50,
    offset = 0,
  } = params;

  const matches = load()
    .tasks.filter(
      (row) =>
        canSee(user, row) &&
        (month === undefined ||
          row.month === month ||
          // Unfinished work from earlier months, when the caller asks for it
          (include_late && row.month < month && row.status !== "done")) &&
        (client_id === undefined || row.client_id === client_id) &&
        (assigned_to === undefined || row.assigned_to_id === assigned_to) &&
        (status === undefined || row.status === status),
    )
    .sort(byDeadline);

  return {
    items: matches.slice(offset, offset + limit).map(toTask),
    total: matches.length,
    limit,
    offset,
  };
}

export function createTask(request: TaskCreateRequest): Task {
  const user = requireUser();
  const current = load();

  if (!can(user, "can_create_content")) {
    throw fakeApiError(403, "You don't have permission to add cards.");
  }

  const assigneeId = request.assigned_to ?? null;

  if (assigneeId !== null && !can(user, "can_assign")) {
    throw fakeApiError(403, "You don't have permission to assign cards.");
  }

  // Validate everything before changing anything
  const client = findClientRow(request.client_id);

  if (!client || client.is_archived) {
    throw fakeApiError(422, "Choose an active client.");
  }

  validateMonth(request.month);

  const title = cleanTitle(request.title);
  const content = cleanContent(request.content ?? "");
  const postingDate = request.posting_date ?? null;
  const deadline = request.deadline ?? null;

  validateDates(postingDate, deadline);
  validateContentType(client.id, request.month, request.content_type_id);

  if (assigneeId !== null) {
    validateAssignee(assigneeId);
  }

  const now = new Date().toISOString();
  const row: TaskRow = {
    id: current.nextId,
    client_id: client.id,
    content_type_id: request.content_type_id,
    month: request.month,
    title,
    content,
    status: assigneeId === null ? "new" : "todo",
    created_by_id: user.id,
    assigned_to_id: assigneeId,
    file_link: null,
    posting_date: postingDate,
    deadline,
    reviews: [],
    created_at: now,
    updated_at: now,
  };

  current.tasks.push(row);
  current.nextId += 1;
  save();

  return toTask(row);
}

export function updateTask(id: number, request: TaskUpdateRequest): Task {
  const user = requireUser();
  const row = load().tasks.find((task) => task.id === id);

  if (!row || !canSee(user, row)) {
    throw fakeApiError(404, "Card not found.");
  }

  const editsContent =
    request.content_type_id !== undefined ||
    request.month !== undefined ||
    request.title !== undefined ||
    request.content !== undefined ||
    request.posting_date !== undefined ||
    request.deadline !== undefined;
  const editsAssignee = request.assigned_to !== undefined;

  if (editsContent && !can(user, "can_create_content")) {
    throw fakeApiError(403, "You don't have permission to edit cards.");
  }

  if (editsAssignee && !can(user, "can_assign")) {
    throw fakeApiError(403, "You don't have permission to assign cards.");
  }

  if (!editsContent && !editsAssignee) {
    return toTask(row);
  }

  // Once the designer starts, the brief must not change underneath them
  if (row.status !== "new" && row.status !== "todo") {
    throw fakeApiError(
      409,
      "This card is already in progress, so it can't be edited.",
    );
  }

  // Validate everything before changing anything
  const month = request.month ?? row.month;
  const contentTypeId = request.content_type_id ?? row.content_type_id;
  const postingDate =
    request.posting_date !== undefined ? request.posting_date : row.posting_date;
  const deadline =
    request.deadline !== undefined ? request.deadline : row.deadline;

  if (request.month !== undefined) {
    validateMonth(month);
  }

  const title = request.title !== undefined ? cleanTitle(request.title) : row.title;
  const content =
    request.content !== undefined ? cleanContent(request.content) : row.content;

  validateDates(postingDate, deadline);

  if (request.month !== undefined || request.content_type_id !== undefined) {
    validateContentType(row.client_id, month, contentTypeId);
  }

  if (request.assigned_to !== undefined && request.assigned_to !== null) {
    validateAssignee(request.assigned_to);
  }

  row.month = month;
  row.content_type_id = contentTypeId;
  row.title = title;
  row.content = content;
  row.posting_date = postingDate;
  row.deadline = deadline;

  if (request.assigned_to !== undefined) {
    row.assigned_to_id = request.assigned_to;

    // Assigning starts the card's life as a task; removing the designer undoes it
    if (request.assigned_to !== null && row.status === "new") {
      row.status = "todo";
    } else if (request.assigned_to === null && row.status === "todo") {
      row.status = "new";
    }
  }

  row.updated_at = nextTimestamp(row.updated_at);
  save();

  return toTask(row);
}

const MAX_COMMENT_LENGTH = 1000;
const MAX_LINK_LENGTH = 500;

function cleanFileLink(value: string) {
  const link = value.trim();

  let isValid = false;

  try {
    const url = new URL(link);
    isValid = url.protocol === "http:" || url.protocol === "https:";
  } catch {
    isValid = false;
  }

  if (!isValid || link.length > MAX_LINK_LENGTH) {
    throw fakeApiError(
      422,
      "Enter a valid link, starting with http:// or https://.",
    );
  }

  return link;
}

function cleanComment(value: string) {
  const comment = value.trim();

  if (comment.length > MAX_COMMENT_LENGTH) {
    throw fakeApiError(
      422,
      `Use ${MAX_COMMENT_LENGTH} characters or fewer for the comment.`,
    );
  }

  return comment;
}

const STATUSES: TaskStatus[] = ["new", "todo", "ongoing", "submitted", "fix", "done"];

// Moves a card along the board. The rules live in lib/taskRules.ts; this
// enforces them the way the backend must, in this order: the card must be
// visible (404), the person must have seen its latest version (409), the move
// must exist in the table (409), they must be allowed to make it (403), and
// what they supply must be valid (422). Nothing changes unless all pass.
export function changeTaskStatus(
  id: number,
  request: TaskStatusChangeRequest,
): Task {
  const user = requireUser();
  const row = load().tasks.find((task) => task.id === id);

  if (!row || !canSee(user, row)) {
    throw fakeApiError(404, "Card not found.");
  }

  if (!STATUSES.includes(request.status)) {
    throw fakeApiError(422, "Choose a valid status.");
  }

  if (!request.updated_at) {
    throw fakeApiError(422, "updated_at is required.");
  }

  if (request.updated_at !== row.updated_at) {
    throw fakeApiError(
      409,
      "This card was changed by someone else. Refresh and try again.",
    );
  }

  const rule = getMoveRule(row.status, request.status);

  if (!rule) {
    throw fakeApiError(
      409,
      `A card that is "${STATUS_LABEL[row.status]}" can't move to "${STATUS_LABEL[request.status]}".`,
    );
  }

  // Giving a card to a designer is an assignment, not a plain status change
  if (rule.input === "designer") {
    throw fakeApiError(
      409,
      "Assign a designer to move this card to To do.",
    );
  }

  const task = toTask(row);

  if (!canMove(user, task, request.status)) {
    throw fakeApiError(403, "You don't have permission to move this card.");
  }

  let fileLink = row.file_link;
  let review: ReviewRow | null = null;
  const reviewerId = user.id;
  const now = new Date().toISOString();

  if (rule.input === "file_link") {
    if (!request.file_link || !request.file_link.trim()) {
      throw fakeApiError(422, "Add the link to your finished design.");
    }

    fileLink = cleanFileLink(request.file_link);
  } else if (rule.input === "optional_file_link" && request.file_link) {
    fileLink = cleanFileLink(request.file_link);
  }

  if (rule.input === "comment") {
    const comment = cleanComment(request.comment ?? "");

    if (!comment) {
      throw fakeApiError(422, "Tell the designer what to fix.");
    }

    review = {
      id: 0,
      decision: "rejected",
      comment,
      reviewer_id: reviewerId,
      created_at: now,
    };
  } else if (request.status === "done") {
    const comment = cleanComment(request.comment ?? "");

    review = {
      id: 0,
      decision: "approved",
      comment: comment || null,
      reviewer_id: reviewerId,
      created_at: now,
    };
  }

  row.status = request.status;
  row.file_link = fileLink;

  if (review) {
    review.id = load().nextReviewId;
    load().nextReviewId += 1;
    row.reviews.push(review);
  }

  row.updated_at = nextTimestamp(row.updated_at);
  save();

  return toTask(row);
}

// Only cards nobody has started on can be deleted. The id is never reused.
export function deleteTask(id: number): void {
  const user = requireUser();
  const current = load();
  const index = current.tasks.findIndex((task) => task.id === id);
  const row = current.tasks[index];

  if (!row || !canSee(user, row)) {
    throw fakeApiError(404, "Card not found.");
  }

  if (!can(user, "can_create_content")) {
    throw fakeApiError(403, "You don't have permission to delete cards.");
  }

  if (row.status !== "new" && row.status !== "todo") {
    throw fakeApiError(
      409,
      "This card is already in progress, so it can't be deleted.",
    );
  }

  current.tasks.splice(index, 1);
  save();
}

// ---- month overview ------------------------------------------------------

function buildProgress(target: number, cards: TaskRow[]): ProgressNumbers {
  const written = cards.length;
  const done = cards.filter((card) => card.status === "done").length;
  const assigned = cards.filter((card) => card.assigned_to_id !== null).length;

  const toWrite = Math.max(target - written, 0);
  const deliveryRemaining = Math.max(target - done, 0);

  return {
    target,
    written,
    assigned,
    done,
    to_write: toWrite,
    extra: Math.max(written - target, 0),
    delivery_remaining: deliveryRemaining,
    // What is left to deliver, minus what has not even been written yet
    to_design: Math.max(deliveryRemaining - toWrite, 0),
  };
}

function sumProgress(items: ProgressNumbers[]): ProgressNumbers {
  const sum = (pick: (item: ProgressNumbers) => number) =>
    items.reduce((total, item) => total + pick(item), 0);

  return {
    target: sum((item) => item.target),
    written: sum((item) => item.written),
    assigned: sum((item) => item.assigned),
    done: sum((item) => item.done),
    to_write: sum((item) => item.to_write),
    extra: sum((item) => item.extra),
    delivery_remaining: sum((item) => item.delivery_remaining),
    to_design: sum((item) => item.to_design),
  };
}

export function computeMonthOverview(month: string): ClientMonthOverview[] {
  const user = requireUser();

  if (
    !can(user, "can_create_content") &&
    !can(user, "can_assign") &&
    !can(user, "can_review")
  ) {
    throw fakeApiError(403, "You don't have permission to see this overview.");
  }

  if (!isValidMonth(month)) {
    throw fakeApiError(422, "Enter the month as YYYY-MM.");
  }

  const monthCards = load().tasks.filter((row) => row.month === month);
  const overviews: ClientMonthOverview[] = [];

  for (const client of listClientRows()) {
    const clientCards = monthCards.filter((row) => row.client_id === client.id);

    // Archived clients only show up for months where they still have cards
    if (client.is_archived && clientCards.length === 0) {
      continue;
    }

    const plan = getPlanForMonth(client.id, month);
    const typeIds = new Set<number>([
      ...plan.map((item) => item.content_type.id),
      ...clientCards.map((row) => row.content_type_id),
    ]);

    const types: TypeProgress[] = [];

    for (const typeId of [...typeIds].sort((a, b) => a - b)) {
      const contentType = findContentType(typeId);

      if (!contentType) {
        continue;
      }

      const target = plan.find((item) => item.content_type.id === typeId)?.count ?? 0;
      const cards = clientCards.filter((row) => row.content_type_id === typeId);

      types.push({ content_type: contentType, ...buildProgress(target, cards) });
    }

    overviews.push({
      client: { id: client.id, name: client.name, is_archived: client.is_archived },
      month,
      types,
      totals: {
        ...sumProgress(types),
        unassigned: clientCards.filter((row) => row.assigned_to_id === null).length,
      },
    });
  }

  return overviews.sort((a, b) => a.client.name.localeCompare(b.client.name));
}
