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
    "can_review": false,
    "can_receive_tasks": true
  }
}
```

`role` is `"admin"` or `"member"`. `team` is `null` for admins.

Team flags: `can_manage_clients`, `can_create_content`, `can_assign`, `can_review`,
and `can_receive_tasks` (members of the team can be given cards: the Design team).

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

## Users

### `GET /users/assignable`

Needs `can_assign`. `200` `AssignableUser[]`, sorted by name: the active users whose
team has `can_receive_tasks`. Used by the "Assign to" dropdowns.

```json
[{ "id": 11, "name": "Anu Mathew", "team": { "id": 2, "name": "Design" } }]
```

Declare this route before `/users/{id}`, or `assignable` is read as an id.

## Cards (tasks)

A content card and a board task are the same record. A card starts as `new`, becomes
`todo` when a designer is assigned, and then follows the board flow
(`ongoing`, `submitted`, `fix`, `done`; the status endpoint comes with the board).

`Task`:

```json
{
  "id": 7,
  "client": { "id": 1, "name": "Fresh Bakes" },
  "content_type": { "id": 1, "name": "Poster", "is_active": true },
  "month": "2026-11",
  "title": "Festive offer poster",
  "content": "Caption and talking points...",
  "status": "new",
  "created_by": { "id": 2, "name": "Marketing Demo" },
  "assigned_to": null,
  "file_link": null,
  "latest_review": null,
  "posting_date": "2026-11-14",
  "deadline": "2026-11-10",
  "created_at": "2026-10-06T09:00:00Z",
  "updated_at": "2026-10-06T09:00:00Z"
}
```

`status` is one of `new`, `todo`, `ongoing`, `submitted`, `fix`, `done`.
`month` is the month the card is for ("YYYY-MM"), not the day it was created.
`file_link` is the link to the finished design, set when the designer submits.
`latest_review` is the most recent review or `null`:

```json
{
  "id": 4,
  "decision": "rejected",
  "comment": "Please make the logo bigger.",
  "reviewer": { "id": 2, "name": "Marketing Demo" },
  "created_at": "2026-10-06T09:00:00Z"
}
```

`decision` is `approved` or `rejected`. For a card in `fix`, `latest_review` is the
rejection whose `comment` the designer sees. Reviews are kept as history in a `reviews`
table (`id`, `task_id`, `reviewer_id`, `decision`, `comment`, `created_at`); a listing
endpoint comes with the card detail view.

### `GET /tasks`

Query: `month`, `client_id`, `assigned_to`, `status`, `include_late`, `limit`, `offset`.
`200` paginated `Task`, sorted by `deadline` (cards without one last), then `id`.

`include_late=true` (used with `month`) adds cards of earlier months that are not `done`
yet: work that carried over. The board shows them flagged as late.

Visibility: a user sees a card if they have `can_assign` or `can_review`, are an admin,
are the assignee, or created it. Anything else is invisible (`404` on a single card),
not `403`.

### `POST /tasks`

Needs `can_create_content`. `201` `Task`.

```json
{
  "client_id": 1,
  "content_type_id": 1,
  "month": "2026-11",
  "title": "Festive offer poster",
  "content": "optional text",
  "posting_date": "2026-11-14",
  "deadline": "2026-11-10",
  "assigned_to": 11
}
```

`content`, `posting_date`, `deadline` and `assigned_to` are optional. With `assigned_to`
the card starts as `todo` (this also needs `can_assign`), otherwise as `new`.

- `403` no permission (creating, or assigning).
- `422` validation (below).

### `PATCH /tasks/{id}`

Partial update, `200` `Task`. Editing content fields (`title`, `content`,
`content_type_id`, `month`, `posting_date`, `deadline`) needs `can_create_content`;
changing `assigned_to` needs `can_assign`.

- A card can only be edited while it is `new` or `todo`. After that `409`
  `"This card is already in progress, so it can't be edited."`
- Setting `assigned_to` on a `new` card makes it `todo`. Setting it to `null` on a
  `todo` card makes it `new`.
- `404` unknown or invisible card; `403`, `422` as above.
- Validate everything first; if anything fails, change nothing.

### `PATCH /tasks/{id}/status`

Moves a card along the board. Body:

```json
{
  "status": "submitted",
  "updated_at": "2026-10-06T09:00:00Z",
  "file_link": "https://drive.example.com/file/12",
  "comment": "optional, or required for fix"
}
```

`200` `Task` (with the new `updated_at` and `latest_review`). The moves that exist:

| from | to | who | also needed |
|---|---|---|---|
| `new` | `todo` | `can_assign` | a designer: done with `PATCH /tasks/{id}` and `assigned_to`, not here |
| `todo` | `ongoing` | the card's designer | |
| `ongoing` | `submitted` | the card's designer | `file_link` (required) |
| `submitted` | `done` | `can_review` | `comment` optional; creates an `approved` review |
| `submitted` | `fix` | `can_review` | `comment` required; creates a `rejected` review |
| `fix` | `submitted` | the card's designer | `file_link` optional (replaces the old one) |

Admins may make any move in the table. Nobody else can: being able to assign or review
does not let you do the designer's moves.

Checks, in this order (the first that fails answers):

1. `404` the card does not exist or is invisible to the user.
2. `422` `status` is not a valid status, or `updated_at` is missing.
3. `409` `updated_at` is not the card's current value: `"This card was changed by someone
   else. Refresh and try again."` Two people moving the same card must never overwrite
   each other. `updated_at` must change on every write, and always get strictly later.
4. `409` the move is not in the table: `"A card that is "To do" can't move to "Done"."`
   (and for `new` to `todo`: `"Assign a designer to move this card to To do."`).
5. `403` the user may not make this move.
6. `422` `file_link` missing or not an http(s) link (at most 500 characters), or `comment`
   missing for `fix` or longer than 1000 characters.

Do all of it in one transaction: status, link, review and `updated_at` change together.

### `DELETE /tasks/{id}`

Needs `can_create_content`. `204` with no body.

- A card can only be deleted while it is `new` or `todo`. After that `409`
  `"This card is already in progress, so it can't be deleted."`
- `404` unknown or invisible card; `403` no permission.
- The id is never reused, and the month overview drops the card from its counts.
- Deleting a `todo` card removes it from the assigned designer's list. Notify them once
  notifications exist.

### Card validation

- `title`: trimmed, inner spaces collapsed, 1 to 120 characters.
- `content`: at most 5000 characters, may be empty.
- `client_id`: an existing, non-archived client.
- `month`: `YYYY-MM`, this month (IST) or later, at most 24 months ahead.
- `content_type_id`: an active type that is in the client's plan **for that month**.
  The dropdown only offers those, and this keeps the data consistent.
- `posting_date`, `deadline`: real calendar dates (`2026-02-30` is invalid). If both
  are given, the deadline must not be after the posting date.
- `assigned_to`: an active user whose team has `can_receive_tasks`.

## Month overview

### `GET /clients/overview?month=2026-11`

Needs `can_create_content`, `can_assign` or `can_review`. `200` `ClientMonthOverview[]`
sorted by client name. Not paginated: one entry per client.

Included: every non-archived client, and archived clients only if they have cards in
that month.

```json
{
  "client": { "id": 1, "name": "Fresh Bakes", "is_archived": false },
  "month": "2026-11",
  "types": [
    {
      "content_type": { "id": 1, "name": "Poster", "is_active": true },
      "target": 12, "written": 8, "assigned": 7, "done": 5,
      "to_write": 4, "extra": 0, "delivery_remaining": 7, "to_design": 3
    }
  ],
  "totals": {
    "target": 16, "written": 10, "assigned": 9, "done": 5,
    "to_write": 6, "extra": 0, "delivery_remaining": 11, "to_design": 5,
    "unassigned": 1
  }
}
```

`types` has one entry per content type that is in the plan for the month or has cards in
it (a type that is not in the plan has `target: 0`). Numbers are computed per type, never
stored; `totals` is the sum, plus `unassigned`.

| field | meaning |
|---|---|
| `target` | count in the plan in force for the month |
| `written` | cards created, any status |
| `assigned` | cards with an assignee |
| `done` | cards with status `done` |
| `to_write` | `max(target - written, 0)` |
| `extra` | `max(written - target, 0)` |
| `delivery_remaining` | `max(target - done, 0)` |
| `to_design` | `max(delivery_remaining - to_write, 0)`: has content, waits on design |
| `unassigned` | cards with no assignee (totals only) |

Example from the plan: target 12, written 8, done 5 gives `to_write` 4, `delivery_remaining` 7,
`to_design` 3. Splitting the 7 this way keeps designers from being blamed for content that
was never written.

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
- Cards: a user without `can_create_content` gets `403` on create and edit; assigning needs
  `can_assign` on top; a card cannot be edited once it is `ongoing` or later (`409`).
- Cards: the type must be in the client's plan for the month; past months, impossible dates
  and a deadline after the posting date give `422`; nothing is saved when validation fails.
- Cards: assigning moves `new` to `todo`, unassigning moves `todo` back to `new`.
- Cards: a Design member only lists cards assigned to them (or written by them); another
  member's card is `404`, not `403`.
- Overview: target 12, written 8, done 5 gives to_write 4, delivery_remaining 7, to_design 3;
  extra cards give `extra`; a type missing from the plan has `target` 0; archived clients
  appear only for months where they have cards; changing a plan from next month does not
  change this month's overview.
- Cards: deleting is only possible for `new` and `todo` cards (`409` after that), needs
  `can_create_content` (`403`), hides invisible cards (`404`), and never reuses an id.
- Moves: every pair of statuses that is not in the table gives `409`; each move in the table
  works for the right person and gives `403` for everyone else (a reviewer cannot start a
  card, a designer cannot approve their own, an admin can do all).
- Moves: a stale `updated_at` gives `409` and changes nothing; every successful write moves
  `updated_at` strictly forward; two moves sent with the same `updated_at` let only one win.
- Moves: submitting needs a valid link, rejecting needs a comment; a rejection is stored as
  a review and shows as `latest_review`; resubmitting then approving makes the approval the
  latest review and keeps the rejection in the history.
- Cards: `include_late` adds earlier months' unfinished cards and never earlier `done` ones.
