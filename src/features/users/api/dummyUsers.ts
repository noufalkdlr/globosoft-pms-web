import { DEMO_DATA_MODE, demoStorageKey } from "../../../config/demoData";
import { fakeApiError } from "../../../lib/api/dummyHelpers";
import { can } from "../../../lib/permissions";
import { isValidEmail, normalizeEmail } from "../../../utils/email";
import { readSession, writeSession } from "../../auth/api/dummySession";
import { TEAMS, findTeam } from "../../teams/api/dummyTeams";

import type { PaginatedResponse } from "../../../types/paginationTypes";
import type { AuthUser, UserRole } from "../../auth/types/authTypes";
import type {
  AssignableUser,
  UserCreateRequest,
  UserListParams,
  UserRecord,
  UserUpdateRequest,
} from "../types/userTypes";

// TEMPORARY: stands in for the users table of the FastAPI backend. Sign-in,
// the admin Users screen and the "Assign to" dropdowns all read this one
// table, the way they will read the real one. Delete this file once the real
// API is connected.

const STORAGE_KEY = demoStorageKey("users");
const MAX_NAME_LENGTH = 80;
const MAX_LIST_LIMIT = 100;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 1024 * 1024;

interface UserRow {
  id: number;
  name: string;
  // Stored in lower case, with the dots the admin typed
  email: string;
  role: UserRole;
  team_id: number | null;
  is_active: boolean;
  created_at: string;
  // The photo Google reported at sign-in. The demo has no real Google, so this
  // stays null until the real sign-in fills it.
  google_picture_url?: string | null;
  // The picture the person uploaded, kept here as a data URL (the real backend
  // keeps a file and sends its address)
  avatar_data?: string | null;
}

interface State {
  users: UserRow[];
  nextId: number;
}

function buildSeed(): State {
  const now = new Date().toISOString();
  const row = (
    id: number,
    name: string,
    email: string,
    role: UserRole,
    team_id: number | null,
  ): UserRow => ({ id, name, email, role, team_id, is_active: true, created_at: now });

  // The empty start: just the four people to try the roles with
  if (DEMO_DATA_MODE === "empty") {
    return {
      users: [
        row(1, "George", "george@globosoft.example", "admin", null),
        row(2, "Ramseena", "ramseena@globosoft.example", "member", TEAMS.marketing.id),
        row(3, "Noufal", "noufal@globosoft.example", "member", TEAMS.design.id),
        row(4, "Deepak", "deepak@globosoft.example", "member", TEAMS.marketing.id),
      ],
      nextId: 5,
    };
  }

  return {
    // The first three are the demo accounts on the sign-in screen. The designers
    // after them exist so the "Assign to" dropdown has several names.
    users: [
      row(1, "Admin Demo", "admin.demo@gmail.com", "admin", null),
      row(2, "Marketing Demo", "marketing.demo@gmail.com", "member", TEAMS.marketing.id),
      row(3, "Designer Demo", "designer.demo@gmail.com", "member", TEAMS.design.id),
      row(11, "Anu Mathew", "anu.mathew@gmail.com", "member", TEAMS.design.id),
      row(12, "Rahul Krishnan", "rahul.krishnan@gmail.com", "member", TEAMS.design.id),
      row(13, "Meera Joseph", "meera.joseph@gmail.com", "member", TEAMS.design.id),
    ],
    nextId: 14,
  };
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
    // Unreadable or unavailable storage: start from the seed
  }

  state = buildSeed();
  return state;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(load()));
  } catch {
    // Storage unavailable: changes just will not survive a reload
  }
}

// ---- reading people ---------------------------------------------------------

// Their own upload, else the Google photo, else nothing (initials are shown)
function avatarUrlOf(row: UserRow): string | null {
  return row.avatar_data ?? row.google_picture_url ?? null;
}

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar_url: avatarUrlOf(row),
    has_custom_avatar: Boolean(row.avatar_data),
    role: row.role,
    team: row.team_id === null ? null : (findTeam(row.team_id) ?? null),
  };
}

function toRecord(row: UserRow): UserRecord {
  const team = row.team_id === null ? undefined : findTeam(row.team_id);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar_url: avatarUrlOf(row),
    role: row.role,
    team: team ? { id: team.id, name: team.name } : null,
    is_active: row.is_active,
    created_at: row.created_at,
  };
}

// Anyone, active or not: a card keeps showing the name of a designer who has
// since been deactivated
export function findUser(id: number): AuthUser | undefined {
  const row = load().users.find((user) => user.id === id);

  return row ? toAuthUser(row) : undefined;
}

// The sign-in lookup: find a person by the Gmail address Google reported,
// using Gmail's rules (case, dots and "+tag" do not matter)
export function findAccountByEmail(
  email: string,
): { user: AuthUser; isActive: boolean } | undefined {
  const wanted = normalizeEmail(email);
  const row = load().users.find((user) => normalizeEmail(user.email) === wanted);

  return row ? { user: toAuthUser(row), isActive: row.is_active } : undefined;
}

// The current, saved version of a person. `/auth/me` returns this, so a role or
// team change by an admin reaches the person on their next page load.
export function findActiveUser(id: number): AuthUser | undefined {
  const row = load().users.find((user) => user.id === id);

  return row && row.is_active ? toAuthUser(row) : undefined;
}

// ---- assignable people ------------------------------------------------------

function toAssignable(row: UserRow): AssignableUser | null {
  const team = row.team_id === null ? undefined : findTeam(row.team_id);

  // Only active people on a team that receives tasks (Design)
  return row.is_active && team?.can_receive_tasks
    ? {
        id: row.id,
        name: row.name,
        avatar_url: avatarUrlOf(row),
        team: { id: team.id, name: team.name },
      }
    : null;
}

// Used by the tasks dummy to validate an assignee
export function findAssignableUser(id: number): AssignableUser | undefined {
  const row = load().users.find((user) => user.id === id);

  return row ? (toAssignable(row) ?? undefined) : undefined;
}

// The people told when a design is submitted: active members whose team can
// review. Admins are not included: they have the dashboard, and would be
// pinged about every card in the company.
export function listReviewerIds(): number[] {
  return load()
    .users.filter((user) => {
      const team = user.team_id === null ? undefined : findTeam(user.team_id);

      return user.is_active && user.role === "member" && team?.can_review === true;
    })
    .map((user) => user.id);
}

// Every active Design member, without a permission check: the reports list them
// all so that someone with nothing on their plate shows up too
export function listActiveDesigners(): AssignableUser[] {
  return load()
    .users.map(toAssignable)
    .filter((item): item is AssignableUser => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listAssignableUsers(): AssignableUser[] {
  const user = readSession();

  if (!user) {
    throw fakeApiError(401, "Not authenticated");
  }

  if (!can(user, "can_assign")) {
    throw fakeApiError(403, "You don't have permission to assign cards.");
  }

  return load()
    .users.map(toAssignable)
    .filter((item): item is AssignableUser => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ---- the admin Users API ----------------------------------------------------

// Who is asking is read from the saved table, not from the session copy: an
// admin who was demoted or deactivated a moment ago is refused at once, like
// the real backend refuses a token for an inactive user.
// `deniedMessage` is what a signed-in member is told, so each admin-only area
// can name itself ("Only admins can see the reports.").
export function requireAdmin(
  deniedMessage = "Only admins can manage users.",
): UserRow {
  const session = readSession();

  if (!session) {
    throw fakeApiError(401, "Not authenticated");
  }

  const row = load().users.find((user) => user.id === session.id);

  if (!row || !row.is_active) {
    throw fakeApiError(401, "Not authenticated");
  }

  if (row.role !== "admin") {
    throw fakeApiError(403, deniedMessage);
  }

  return row;
}

function cleanName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function validateName(name: string) {
  const cleaned = cleanName(name);

  if (!cleaned) {
    throw fakeApiError(422, "Enter the person's name.");
  }

  if (cleaned.length > MAX_NAME_LENGTH) {
    throw fakeApiError(422, `Use ${MAX_NAME_LENGTH} characters or fewer for the name.`);
  }

  return cleaned;
}

function validateEmail(email: string) {
  if (!isValidEmail(email)) {
    throw fakeApiError(422, "Enter a valid email address.");
  }

  return email.trim().toLowerCase();
}

function validateRole(role: string): UserRole {
  if (role !== "admin" && role !== "member") {
    throw fakeApiError(422, "Choose a role.");
  }

  return role;
}

// Members belong to a team that exists, admins to none
function validateTeam(role: UserRole, teamId: number | null | undefined) {
  if (role === "admin") {
    if (teamId !== null && teamId !== undefined) {
      throw fakeApiError(422, "Admins don't belong to a team.");
    }

    return null;
  }

  if (teamId === null || teamId === undefined) {
    throw fakeApiError(422, "Choose a team for this person.");
  }

  if (!findTeam(teamId)) {
    throw fakeApiError(422, "That team doesn't exist.");
  }

  return teamId;
}

function ensureEmailIsFree(email: string, exceptId?: number) {
  const wanted = normalizeEmail(email);
  const taken = load().users.some(
    (user) => user.id !== exceptId && normalizeEmail(user.email) === wanted,
  );

  if (taken) {
    throw fakeApiError(409, "That email is already added.");
  }
}

export function listUsers(params: UserListParams = {}): PaginatedResponse<UserRecord> {
  requireAdmin();

  const {
    search,
    role,
    team_id,
    is_active,
    limit: requestedLimit = 50,
    offset = 0,
  } = params;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIST_LIMIT);
  const needle = search?.trim().toLowerCase();

  const matches = load()
    .users.filter(
      (user) =>
        (!needle ||
          user.name.toLowerCase().includes(needle) ||
          user.email.toLowerCase().includes(needle)) &&
        (role === undefined || user.role === role) &&
        (team_id === undefined || user.team_id === team_id) &&
        (is_active === undefined || user.is_active === is_active),
    )
    .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);

  return {
    items: matches.slice(offset, offset + limit).map(toRecord),
    total: matches.length,
    limit,
    offset,
  };
}

export function createUser(request: UserCreateRequest): UserRecord {
  requireAdmin();

  const name = validateName(request.name);
  const email = validateEmail(request.email);
  const role = validateRole(request.role);
  const teamId = validateTeam(role, request.team_id);
  ensureEmailIsFree(email);

  const current = load();
  const row: UserRow = {
    id: current.nextId,
    name,
    email,
    role,
    team_id: teamId,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  current.nextId += 1;
  current.users.push(row);
  save();

  return toRecord(row);
}

function activeAdminCount() {
  return load().users.filter((user) => user.role === "admin" && user.is_active).length;
}

// The rules for changing a person, in the order the backend must check them:
// the target exists (404), what was sent is valid (422), the app keeps at least
// one active admin and nobody locks themselves out (409), the email is free (409).
export function updateUser(id: number, request: UserUpdateRequest): UserRecord {
  const actor = requireAdmin();
  const row = load().users.find((user) => user.id === id);

  if (!row) {
    throw fakeApiError(404, "User not found.");
  }

  const name = request.name === undefined ? row.name : validateName(request.name);
  const email = request.email === undefined ? row.email : validateEmail(request.email);
  const role = request.role === undefined ? row.role : validateRole(request.role);
  const isActive = request.is_active ?? row.is_active;

  // Moving someone to another role needs a clear answer about their team
  const roleChanges = role !== row.role;
  const teamId = validateTeam(
    role,
    request.team_id !== undefined
      ? request.team_id
      : roleChanges
        ? undefined
        : row.team_id,
  );

  const losesAdminPower =
    row.role === "admin" && row.is_active && (role !== "admin" || !isActive);

  // Safety net: there must always be someone who can manage users. Checked
  // first, so the only admin hears the more useful reason.
  if (losesAdminPower && activeAdminCount() <= 1) {
    throw fakeApiError(409, "There must be at least one active admin.");
  }

  if (row.id === actor.id) {
    if (roleChanges) {
      throw fakeApiError(409, "You can't change your own role.");
    }

    if (!isActive) {
      throw fakeApiError(409, "You can't deactivate your own account.");
    }

    if (normalizeEmail(email) !== normalizeEmail(row.email)) {
      throw fakeApiError(409, "You can't change your own email.");
    }
  }

  ensureEmailIsFree(email, row.id);

  row.name = name;
  row.email = email;
  row.role = role;
  row.team_id = teamId;
  row.is_active = isActive;
  save();

  return toRecord(row);
}

// ---- the signed-in person's own picture -------------------------------------

// The row of whoever is asking, read from the saved table like requireAdmin
function requireSelf(): UserRow {
  const session = readSession();
  const row = session ? load().users.find((user) => user.id === session.id) : undefined;

  if (!row || !row.is_active) {
    throw fakeApiError(401, "Not authenticated");
  }

  return row;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// PUT /users/me/avatar. The app has already cropped the picture to a square and
// shrunk it; the backend still checks the type and size of what it receives.
export async function setMyAvatar(file: Blob): Promise<AuthUser> {
  const row = requireSelf();

  if (!AVATAR_TYPES.includes(file.type)) {
    throw fakeApiError(422, "Choose a JPEG, PNG or WebP picture.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw fakeApiError(422, "Use a picture under 1 MB.");
  }

  row.avatar_data = await readAsDataUrl(file);
  save();

  const user = toAuthUser(row);
  writeSession(user);

  return user;
}

// DELETE /users/me/avatar: back to the Google photo, or to initials
export function removeMyAvatar(): AuthUser {
  const row = requireSelf();

  row.avatar_data = null;
  save();

  const user = toAuthUser(row);
  writeSession(user);

  return user;
}
