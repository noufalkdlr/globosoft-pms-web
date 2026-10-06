# API contract

What the frontend expects from the FastAPI backend. It grows with every step;
the dummy API files in the frontend follow these rules exactly, so they double
as a reference implementation (and as the source of backend test cases).

## Conventions

- Base URL comes from `VITE_API_URL`. **No trailing slashes** (`/clients`, not `/clients/`).
- JSON bodies and responses use **snake_case**.
- Auth is an httpOnly cookie session. A missing or expired session answers `401`.
- Errors: `{ "detail": "message" }`. Request validation errors (`422`) may use FastAPI's
  list form `{ "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }`;
  the frontend shows the first `msg`.
- Months are strings like `"2026-11"`. A month starts and ends in **IST (Asia/Kolkata)**.
- List endpoints take `limit` (default 50, max 100) and `offset`, and answer
  `{ "items": [...], "total": 123, "limit": 50, "offset": 0 }`.
- Permission names (`can_manage_clients` ...) are flags on the user's team. An
  **admin has every permission** (admins have no team).
- The frontend hides what a user may not do, but the **backend must enforce every
  rule and answer `403`**.

## Auth

### `POST /auth/google`

Sign in with Google. Body: `{ "credential": "<Google ID token>" }`.

- `200` `{ "user": User }` and a session cookie.
- `401` the token is invalid or expired.
- `403` the email is not in the users table, or `is_active` is false.

Rules: verify the token with Google (audience, expiry, `email_verified`). Compare
emails lower-cased, and for `gmail.com` ignore dots and `+tag` parts
(`Noufal.Globosoft@gmail.com` and `noufalglobosoft@gmail.com` are one account).

`User`:

```json
{
  "id": 3,
  "name": "Designer Demo",
  "email": "designer.demo@gmail.com",
  "role": "member",
  "team": {
    "id": 2,
    "name": "Design",
    "can_manage_clients": false,
    "can_create_content": false,
    "can_assign": false,
    "can_review": false
  }
}
```

`role` is `"admin"` or `"member"`. `team` is `null` for admins.

### `GET /auth/me`

`200` `User` for the current session, `401` without one. Called on app start.

### `POST /auth/logout`

Clears the session cookie. `204`.

### `POST /auth/refresh`

Rotates the session using the refresh cookie. `204`, or `401` if it cannot refresh.

## Content types

Content types are data, not code: Marketing can add new ones from a dropdown.
They are never deleted, only deactivated, so old cards keep their type.

`ContentType`: `{ "id": 1, "name": "Poster", "is_active": true }`

### `GET /content-types`

Any signed-in user. `200` `ContentType[]` ordered by `id`, including inactive ones.

### `POST /content-types`

Needs `can_manage_clients`. Body: `{ "name": "Carousel" }`. `201` `ContentType`.

- `403` no permission.
- `409` `"That content type already exists."` (same name ignoring case).
- `422` name empty or longer than 40 characters.

Rules: trim the name and collapse inner spaces before saving and comparing.
Unique, case-insensitive (`Poster` and `poster` must never both exist).

## Clients

Clients are never deleted, only archived (`is_archived`), so history and reports
stay intact. There is no `DELETE /clients`.

`Client`:

```json
{
  "id": 1,
  "name": "Fresh Bakes",
  "notes": "Bakery chain with three outlets in Kochi.",
  "is_archived": false,
  "current_plan": [
    { "content_type": { "id": 1, "name": "Poster", "is_active": true }, "count": 12 },
    { "content_type": { "id": 2, "name": "Reel", "is_active": true }, "count": 4 }
  ]
}
```

`current_plan` is the plan in force for the current month, ordered by content
type `id`. It is **computed**, never stored on the client (see Plan history).

### `GET /clients`

Any signed-in user (Design can view). Query: `search`, `is_archived` (default
`false`), `limit`, `offset`. `200` paginated `Client`.

- `search` matches the name, case-insensitive, substring.
- Sorted by name.

### `POST /clients`

Needs `can_manage_clients`. `201` `Client`.

```json
{
  "name": "Fresh Bakes",
  "notes": "optional text",
  "plan": {
    "effective_from_month": "2026-10",
    "items": [
      { "content_type_id": 1, "count": 12 },
      { "content_type_id": 2, "count": 4 }
    ]
  }
}
```

`notes` and `plan` are optional. Errors:

- `403` no permission.
- `409` `"A client with this name already exists."` Case-insensitive, and archived
  clients count too (reusing a name would make old reports ambiguous).
- `422` see Validation.

### `PATCH /clients/{id}`

Needs `can_manage_clients`. Partial update, `200` `Client`. Any of `name`, `notes`,
`is_archived`, `plan`.

- Archive: `{ "is_archived": true }`. Restore: `{ "is_archived": false }`.
- `404` `"Client not found."`; `403`, `409`, `422` as above.
- Validate everything first; if anything fails, change nothing.

### Validation

- `name`: trimmed, inner spaces collapsed, 1 to 100 characters.
- `notes`: at most 500 characters; blank becomes `null`.
- `plan.effective_from_month`: `YYYY-MM`, and **not earlier than the current month
  (IST)**. Starting a plan in the past would silently rewrite finished months.
- each plan item: `content_type_id` must be an active content type; `count` is an
  integer from 1 to 999; a content type appears only once per plan.

### Plan history

Do not keep one editable number per client. Store history rows and derive the plan.

Table `client_plan_items`:

| column | |
|---|---|
| `client_id` | FK to clients |
| `content_type_id` | FK to content_types |
| `count` | integer; `0` means "ended" |
| `effective_from_month` | `"YYYY-MM"` |
| `created_by`, `created_at` | who and when |

Unique on `(client_id, content_type_id, effective_from_month)`.

**Plan in force for month M** = for each content type, take the row with the
greatest `effective_from_month <= M`; keep it if `count > 0`.

**Saving a plan change from month M** (`plan` in create or update):

1. Compute the plan in force for M before changing anything.
2. Delete this client's rows whose `effective_from_month == M` (saving twice for
   the same month replaces the first save).
3. Insert one row per submitted item, starting at M.
4. For every type that was in force but is not in the submitted items, insert a
   row with `count = 0` starting at M (the type ends from M).

Result: months before M, and every report built on them, never change. Months
from M on follow the new plan, and keep following it until the next change.
Do all of it in one database transaction.

## Backend tests to write (pytest)

- A user without `can_manage_clients` gets `403` on every write; an admin never does.
- Duplicate names (different case, archived clients) give `409`; the failed request creates nothing.
- Archived clients are hidden by default and shown with `is_archived=true`.
- Pagination: `total` is the full count regardless of `limit` and `offset`.
- Plan history: change from next month leaves this month unchanged; dropping a type
  ends it from that month only; saving the same month twice replaces; an empty
  `items` list ends everything from that month; a start month in the past gives `422`.
- IST boundary: at 18:30 UTC on the last day of a month, "current month" is already the next one.
- Gmail normalisation on sign-in (case, dots, `+tag`); inactive users get `403`.
