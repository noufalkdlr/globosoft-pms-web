# API contract

What the frontend expects from the FastAPI backend. It grows with every step;
the dummy API files in the frontend follow these rules exactly, so they double
as a reference implementation (and as the source of backend test cases).

Two more documents go with it:

- `database.md`: the tables behind these endpoints (columns, constraints, indexes, delete rules).
- `api-errors.md`: every error the dummy API raises, endpoint by endpoint, with its exact words.
  The frontend shows `detail` to people as it is, so the backend must answer the **same status
  with the same words**. It is generated (`npm run docs:errors`), so it cannot drift from the dummy API.

**The rule for changes:** a change that touches data, permissions or validation is made in the dummy
API, in this file and in `database.md` in the same commit, and `npm run docs:errors` is run.

## Conventions

- Base URL comes from `VITE_API_URL`. **No trailing slashes** (`/clients`, not `/clients/`).
- JSON bodies and responses use **snake_case**.
- Auth is an httpOnly cookie session. A missing or expired session answers `401`.
- Errors: `{ "detail": "message" }`. Request validation errors (`422`) may use FastAPI's
  list form `{ "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }`;
  the frontend shows the first `msg`.
- Months are strings like `"2026-11"`. A month starts and ends in **IST (Asia/Kolkata)**.
- List endpoints take `limit` (default 50, max 100; `GET /tasks` allows up to 500 because the
  board loads a whole month at once) and `offset`, and answer
  `{ "items": [...], "total": 123, "limit": 50, "offset": 0 }`.
- Permission names (`can_manage_clients` ...) are flags on the user's team. An
  **admin has every permission** (admins have no team).
- The frontend hides what a user may not do, but the **backend must enforce every
  rule and answer `403`**.

### Open decisions (not decided yet)

These are not settled, so the frontend does not depend on them. Decide them when the backend is
written, then replace this list with the answer.

- **Cookies and CORS.** The frontend sends cookies (`withCredentials`). Needs: the exact web origin
  allowed by CORS (never `*` with cookies), `Secure` and `HttpOnly` on the session cookie, a
  `SameSite` value, and protection against cross-site requests (CSRF) if web and API are on
  different sites. Simplest: serve both under one site (for example `app.` and `api.` of the same
  domain) with `SameSite=Lax`.
- **Session and refresh.** How long a session lasts, how `POST /auth/refresh` rotates it, and
  whether logout revokes it on the server. The frontend only needs: a missing or expired session
  is `401`, and one `POST /auth/refresh` is tried before the user is sent to login.
- **Card detail and review history.** `GET /tasks/{id}` and a list of a card's reviews are not
  built yet; no screen calls them.
- **Where uploaded pictures are stored.** A folder served by the web server, or object storage
  (S3 and the like). The contract only needs the address (`avatar_url`) to be loadable by a browser.
- **Team permissions.** `PATCH /teams/{id}/permissions` does not exist yet; the flags are seed data.

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
  "avatar_url": "https://lh3.googleusercontent.com/a/abc123=s96-c",
  "has_custom_avatar": false,
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

`role` is `"admin"` or `"member"`. `team` is `null` for admins. `avatar_url` is the picture to show
(their own upload, else their Google photo, else `null`); `has_custom_avatar` is true when it is
their own upload (see *Profile picture* under Users).

Team flags: `can_manage_clients`, `can_create_content`, `can_assign`, `can_review`,
and `can_receive_tasks` (members of the team can be given cards: the Design team).

### `GET /auth/me`

`200` `User` for the current session, `401` without one. Called on app start.

It returns the person **as saved now**, not as they were when they signed in: a role or
team change by an admin reaches them on their next load. A person who was deactivated
gets `401` (and every other endpoint refuses them too, at once, not only at the next
sign-in).

### `POST /auth/logout`

Clears the session cookie. `204`.

### `POST /auth/refresh`

Rotates the session using the refresh cookie. `204`, or `401` if it cannot refresh.

## Content types

Content types are data, not code: Marketing can add new ones from a dropdown, and an admin renames
them or turns them off (Admin, Content types). They are never deleted, only turned off, so old
cards keep their type.

`ContentType`: `{ "id": 1, "name": "Poster", "is_active": true }`

**Turned off** (`is_active: false`) means the type can no longer be **added** to a plan: not when
creating a client, and not when changing a plan for a type the client does not already have.
Everything that already uses it keeps working: a client whose plan has the type can save plan
changes that keep it, and cards can still be written for it, because being in the client's plan
for the month is what allows a card. Turning it on again undoes it.

### `GET /content-types`

Any signed-in user (`401` without a session). `200` `ContentType[]` ordered by `id`, including
inactive ones.

### `POST /content-types`

Needs `can_manage_clients`. Body: `{ "name": "Carousel" }`. `201` `ContentType`.

- `403` no permission: `"You don't have permission to add content types."`
- `409` `"That content type already exists."` (same name ignoring case).
- `422` name empty or longer than 40 characters.

Rules: trim the name and collapse inner spaces before saving and comparing.
Unique, case-insensitive (`Poster` and `poster` must never both exist).

### `PATCH /content-types/{id}`

Admins only. Body, every field optional: `{ "name": "Posters", "is_active": false }`.
`200` `ContentType`. An empty body changes nothing and answers `200`.

- `401` without a session. `403` `"Only admins can change content types."` for anyone else,
  checked before anything else about the request.
- `404` `"Content type not found."`
- `409` `"That content type already exists."` The name is compared like in `POST`, **except that
  the type itself is left out**, so a type can change the case of its own name.
- `422` name empty or longer than 40 characters; `is_active` not true or false.
- Validate everything first; if anything fails, change nothing.

**Renaming also renames the cards the app named after the type**, in the same transaction: a card
whose `title` is exactly `<old name> <number>` (compared without regard to case) becomes
`<new name> <number>`. A title someone typed is kept as typed. This does not change the card's
`updated_at` and sends no notification, because nobody edited the card. (Titles are not unique, so
in a rare case a renamed card can end up with the same title as a card named by hand.)

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
- each plan item: `content_type_id` must be an active content type, **or a type the client
  already has in the plan in force on `effective_from_month`** (a type that was turned off stays
  in plans that already use it); `count` is an
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
[{ "id": 11, "name": "Anu Mathew", "avatar_url": null, "team": { "id": 2, "name": "Design" } }]
```

Declare this route before `/users/{id}`, or `assignable` is read as an id.

### Profile picture

Everyone has a picture of their own, or none (the app then draws their initials). `avatar_url` is
sent wherever a person appears: `User`, `UserRecord`, `AssignableUser` and the people on a card.

- **Which picture.** Their own upload if they made one, else the photo Google reported when they
  last signed in (`picture` in the ID token; keep it up to date at every sign-in), else `null`.
- `avatar_url` must be an address a browser can load in an `<img>` without the session cookie
  (the app sets no referrer for it). An upload gets a new random file name each time, so the
  address changes and caches never show the old picture.
- The picture is the person's own: **only they** change it. There is no admin screen for it.

#### `PUT /users/me/avatar`

Any signed-in person. `multipart/form-data` with one field, `file`. `200` `User` (the signed-in
person, with the new `avatar_url` and `has_custom_avatar: true`). The app has already cropped the
picture to a square and shrunk it (256 px, WebP), so the backend does not crop, but it checks:

- `422` `"Choose a JPEG, PNG or WebP picture."`: look at the file's real content, not its name
  or the `Content-Type` the client claims.
- `422` `"Use a picture under 1 MB."`
- `401` without a session, as everywhere. Replacing a picture deletes the old file.

#### `DELETE /users/me/avatar`

Removes their upload and answers `200` `User`: `avatar_url` is their Google photo again (or `null`),
`has_custom_avatar` is `false`. Doing it with no upload is fine. Declare both routes before
`/users/{id}`.

### Users (admin)

The Users screen. Everything here is for admins only: `401` without a session (or for
a deactivated person), `403` `"Only admins can manage users."` for anyone else. Who is
asking is read from the saved users table, not from the token's copy of the person: an
admin who was demoted a moment ago is refused at once.

`UserRecord`:

```json
{
  "id": 11,
  "name": "Anu Mathew",
  "email": "anu.mathew@gmail.com",
  "avatar_url": null,
  "role": "member",
  "team": { "id": 2, "name": "Design" },
  "is_active": true,
  "created_at": "2026-10-06T09:00:00Z"
}
```

`role` is `admin` or `member`. `team` is `null` for admins and set for members.
`is_active: false` means deactivated: they cannot sign in, but the account and every card
or review that mentions them stay. People are never deleted.

#### `GET /teams`

Admin only. `200` `Team[]` with the permission flags (`can_manage_clients`,
`can_create_content`, `can_assign`, `can_review`, `can_receive_tasks`). The flags are seed
data for now; a screen to change them comes later (`PATCH /teams/{id}/permissions`).

#### `GET /users`

Query: `search` (part of the name or the email), `role`, `team_id`, `is_active`, `limit`
(default 50, max 100), `offset`. `200` paginated `UserRecord`, sorted by name.

#### `POST /users`

```json
{ "name": "Anu Mathew", "email": "Anu.Mathew@gmail.com", "role": "member", "team_id": 2 }
```

`201` `UserRecord`. The person signs in with that Google account. No password.

- `422` the name is empty or over 80 characters, the email is not an address, `role` is not
  `admin` or `member`, a member has no team (`"Choose a team for this person."`), the team
  does not exist, or an admin was given a team (`"Admins don't belong to a team."`).
- `409` `"That email is already added."` Compare emails the way Gmail does (below), so
  `Anu.Mathew@gmail.com` and `anumathew+pms@gmail.com` are the same person.

**Email rule (also used at sign-in).** Store the address in lower case, as typed. To
compare two addresses, normalise both: lower case; and for `gmail.com` / `googlemail.com`,
remove the dots and anything after a `+` in the part before the `@`. Keep a normalised
copy of the address with a unique index.

#### `PATCH /users/{id}`

Any of `name`, `email`, `role`, `team_id`, `is_active`. `200` `UserRecord`. Checks, in this
order:

1. `404` no such user.
2. `422` the same field rules as `POST`. Changing a member to admin clears the team;
   changing an admin to member needs a `team_id` in the same request.
3. `409` `"There must be at least one active admin."` if the change would remove the last
   active admin (demoting them or deactivating them). This is a safety net: the next
   rule already stops people changing themselves, so only a mistake elsewhere can reach it.
4. `409` on yourself: `"You can't change your own role."`, `"You can't deactivate your own
   account."`, `"You can't change your own email."` Nobody can lock themselves out.
5. `409` `"That email is already added."` (not counting this same person).

#### Sign-in and deactivated people

`POST /auth/google` looks the person up with the email rule above and answers `403` with
one of two messages: `"Your account hasn't been added yet. Ask an admin to add you."` (no
such person) or `"Your account has been deactivated. Ask an admin if this is a mistake."`
(found, but `is_active` is false).

When someone is deactivated, their open cards stay assigned to them. The Users screen warns
the admin ("They still have 3 unfinished cards") using `GET /tasks?assigned_to=`.
A deactivated designer no longer appears in `GET /users/assignable`.

## Cards (tasks)

A content card and a board task are the same record. A card starts as `todo`, with
`assigned_to` set to `null` until someone gives it to a designer. **Having a designer is not
a status**: assigning (or taking the designer off) never changes `status`. A `todo` card with
no designer is shown as "without a designer"; it cannot be started until it has one. From
`todo` the card follows the board flow (`ongoing`, `submitted`, `fix`, `done`).

`Task`:

```json
{
  "id": 7,
  "client": { "id": 1, "name": "Fresh Bakes" },
  "content_type": { "id": 1, "name": "Poster", "is_active": true },
  "month": "2026-11",
  "title": "Poster 3",
  "content": "Caption and talking points...",
  "notes": "Use the brand colours. Logo top-left.",
  "status": "todo",
  "created_by": { "id": 2, "name": "Marketing Demo", "avatar_url": null },
  "assigned_to": null,
  "file_link": null,
  "latest_review": null,
  "posting_date": "2026-11-14",
  "deadline": "2026-11-10",
  "created_at": "2026-10-06T09:00:00Z",
  "updated_at": "2026-10-06T09:00:00Z",
  "actions": {
    "can_edit": true,
    "can_delete": true,
    "can_assign": true,
    "moves": []
  }
}
```

`created_by`, `assigned_to` and `reviewer` are a person: `{ id, name, avatar_url }` (`avatar_url` is
`null` when they have no picture). `status` is one of `todo`, `ongoing`, `submitted`, `fix`, `done`.
`month` is the month the card is for ("YYYY-MM"), not the day it was created.
`actions` is described right below.
`file_link` is the link to the finished design, set when the designer submits.
`latest_review` is the most recent review or `null`:

```json
{
  "id": 4,
  "decision": "rejected",
  "comment": "Please make the logo bigger.",
  "reviewer": { "id": 2, "name": "Marketing Demo", "avatar_url": null },
  "created_at": "2026-10-06T09:00:00Z"
}
```

`decision` is `approved` or `rejected`. For a card in `fix`, `latest_review` is the
rejection whose `comment` the designer sees. Reviews are kept as history in a `reviews`
table (`id`, `task_id`, `reviewer_id`, `decision`, `comment`, `created_at`); a listing
endpoint comes with the card detail view.

### `actions`: what the signed-in person may do with a card

Every `Task` the API sends (in lists, after a create, an edit, a move) carries `actions`,
**worked out by the backend for the person who is asking**:

```json
"actions": {
  "can_edit": false,
  "can_delete": false,
  "can_assign": false,
  "moves": [
    { "status": "done", "input": null },
    { "status": "fix", "input": "comment" }
  ]
}
```

- `can_edit`: may change the card's content, type and dates (`PATCH /tasks/{id}`). True when the
  card is `todo` and the person has `can_create_content`.
- `can_delete`: may delete it. Same condition as `can_edit`.
- `can_assign`: may give it to a designer or take the designer off. True when the card is `todo`
  and the person has `can_assign`.
- `moves`: the statuses the person may move it to with `PATCH /tasks/{id}/status`, in the order of
  the table there, each with the `input` that move asks for: `null` (nothing),
  `"file_link"` (the finished design's link is required), `"optional_file_link"`, or
  `"comment"` (a reason is required). Empty when there is none (a card nobody holds has no moves,
  not even for an admin).

**The website and the phone app only read `actions`.** They must not work out who may do what
from `status`, the team's permissions and `assigned_to`: that would write the rules a second and a
third time, and the copies drift apart. The backend still refuses anything not listed
(`403`/`409`), because a client can be wrong or changed. The values are as of the moment of the
response: the person may lose a permission a minute later.

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
  "content": "The caption and talking points",
  "notes": "optional instructions for the designer",
  "posting_date": "2026-11-14",
  "deadline": "2026-11-10",
  "assigned_to": 11
}
```

`content`, `notes`, `posting_date`, `deadline` and `assigned_to` are optional. With
`assigned_to` the card starts with that designer (this also needs `can_assign`); without it the card has
no designer yet. Either way its `status` is `todo`.

**The title is optional, and the app does not ask for one.** A card is named after its content
type and a number: `Poster 3`. Without a `title` (or with a blank one) the backend gives it the name
`<content type name> <n>`, where `n` is one more than the highest number already used by this
client's cards **of the same month** whose title is `<same type name> <number>` (compared without
regard to case). So numbers are per client, per month and per type, and a number is never given
out twice while a card holds it (deleting card 2 of 3 makes the next one 4, not 3). A `title`
that is given is kept as typed (trimmed, 1 to 120 characters) and does not use up a number.

`content` is what the post says (caption, talking points). `notes` is a separate, optional place for
instructions to the designer (colours, size, where the logo goes). The writer's form requires
`content`; the API does not.

- `403` no permission (creating, or assigning).
- `422` validation (below).

### `PATCH /tasks/{id}`

Partial update, `200` `Task`. Editing content fields (`title`, `content`, `notes`,
`content_type_id`, `month`, `posting_date`, `deadline`) needs `can_create_content`;
changing `assigned_to` needs `can_assign`.

The body always carries `updated_at`, the value the person saw (required, like in the status
endpoint): `{ "updated_at": "2026-10-06T09:00:00Z", "content": "..." }`. Two people editing, assigning
or moving the same card must never overwrite each other.

Checks, in this order (the first that fails answers):

1. `404` the card does not exist or is invisible to the user.
2. `422` `updated_at` is missing: `"updated_at is required."`
3. `409` `updated_at` is not the card's current value: `"This card was changed by someone else.
   Refresh and try again."` `updated_at` must change on every write and always get strictly later.
4. `403` the user may not make this change (see above).
5. `409` the card is already in progress (below).
6. `422` validation (*Card validation*).

- A card can only be edited while it is `todo`. After that `409`
  `"This card is already in progress, so it can't be edited."`
- Setting `assigned_to` gives the card to that designer, and setting it to `null` takes the
  designer off. The `status` stays `todo` either way. Giving a card to a designer sends them an
  `assigned` notification; taking it off sends `unassigned` (see Notifications).
- A request that changes nothing but carries a current `updated_at` answers `200` with the card as it is.
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
| `todo` | `ongoing` | the card's designer | |
| `ongoing` | `submitted` | the card's designer | `file_link` (required) |
| `submitted` | `done` | `can_review` | `comment` optional; creates an `approved` review |
| `submitted` | `fix` | `can_review` | `comment` required; creates a `rejected` review |
| `fix` | `submitted` | the card's designer | `file_link` optional (replaces the old one) |

Admins may make any move in the table. Nobody else can: being able to assign or review
does not let you do the designer's moves. **A card with no designer cannot be started by
anyone, admins included**: give it to a designer first (`PATCH /tasks/{id}` with `assigned_to`).
There is no move that gives a card to a designer.

Checks, in this order (the first that fails answers):

1. `404` the card does not exist or is invisible to the user.
2. `422` `status` is not a valid status, or `updated_at` is missing.
3. `409` `updated_at` is not the card's current value: `"This card was changed by someone
   else. Refresh and try again."` Two people moving the same card must never overwrite
   each other. `updated_at` must change on every write, and always get strictly later.
4. `409` the move is not in the table: `"A card that is "To do" can't move to "Done"."`
   Also `409` when the move is a designer's and the card has no designer:
   `"Give this card to a designer before moving it."`
5. `403` the user may not make this move.
6. `422` `file_link` missing or not an http(s) link (at most 500 characters), or `comment`
   missing for `fix` or longer than 1000 characters.

Do all of it in one transaction: status, link, review and `updated_at` change together.

### `DELETE /tasks/{id}`

Needs `can_create_content`. `204` with no body.

- A card can only be deleted while it is `todo`. After that `409`
  `"This card is already in progress, so it can't be deleted."`
- `404` unknown or invisible card; `403` no permission.
- The id is never reused, and the month overview drops the card from its counts.
- Deleting a `todo` card removes it from the assigned designer's list. Notify them once
  notifications exist.

### Card validation

- `title`: optional. When given: trimmed, inner spaces collapsed, 1 to 120 characters. An
  explicit empty title in `PATCH` is `422`. When absent on create: named automatically (above).
- `content`: at most 5000 characters, may be empty.
- `notes`: at most 2000 characters, may be empty (`"Use 2000 characters or fewer for the notes."`).
- `client_id`: an existing, non-archived client.
- `month`: `YYYY-MM`, this month (IST) or later, at most 24 months ahead.
- `content_type_id`: a type that is in the client's plan **for that month**. (Whether the type
  is turned off does not matter: a plan that already has it keeps it.) The dropdown only offers
  those, and this keeps the data consistent.
- `posting_date`, `deadline`: real calendar dates (`2026-02-30` is invalid). If both
  are given, the deadline must not be after the posting date. A deadline that is **set or
  changed** may not be in the past (compared with today in IST): `422`
  `"The deadline can't be in the past."` A card that already has a deadline which has since
  passed keeps it, and edits that do not touch the deadline are not refused because of it.
- `assigned_to`: an active user whose team has `can_receive_tasks`.

**Renaming.** When `content_type_id` or `month` changes in a `PATCH` without a `title`, a card
whose current title is the app's own (`<its old type's name> <number>`) is renamed with the new
type and the next free number there (`Poster 3` becomes `Reel 1`). A title somebody chose is
kept, and a `title` in the request always wins. Editing anything else never renames a card.

## Notifications

The bell. In-app only: no email, no WhatsApp, and no push yet (push comes with the PWA).
The app asks for news every 30 seconds, so there is no websocket to build.

### The table (`notifications`)

| column | meaning |
|---|---|
| `id` | |
| `user_id` | who it is for. Everyone sees only their own. |
| `type` | `assigned`, `unassigned`, `updated`, `deleted`, `submitted`, `approved`, `sent_back` |
| `task_id` | the card. It becomes `null` when the card is deleted (a foreign key with `ON DELETE SET NULL`), so old lines stay but no longer link anywhere. |
| `message` | the sentence to show, **written by the backend when it happens** and stored, so the bell never rebuilds one |
| `is_read` | |
| `created_at` | |

Index `(user_id, is_read, created_at)`. Write the row **in the same transaction** as the change
that causes it.

### Who is told what

Nobody is told about something they did themselves (an admin who approves a card does not get
"approved" about it).

| what happened | who is told | `type` |
|---|---|---|
| a card is created with a designer, or a designer is given a card | that designer | `assigned` |
| the designer is taken off, or replaced | the designer who had it | `unassigned` |
| the brief of a card that has a designer changes (title, content, notes, type, month, deadline, posting date) and the designer stays | that designer | `updated` |
| a card that has a designer is deleted | that designer (`task_id` null) | `deleted` |
| a design is submitted (also a resubmission) | every **active member whose team has `can_review`**. Admins are not included: they have the dashboard, and would hear about every card in the company. | `submitted` |
| a design is approved | the card's designer | `approved` |
| a design is sent back | the card's designer, with the start of the comment (120 characters) | `sent_back` |

A change that does nothing (saving a card without changing anything, a refused move) tells nobody.
Replacing the designer sends two lines: `assigned` to the new one and `unassigned` to the old one.
Changing the brief and replacing the designer in one request sends `assigned` to the new designer and `unassigned` to the old one, but no `updated`.

The sentences (the first word is the person who did it):

- `assigned`: `Marketing Demo gave you "Festive offer poster 3" (Fresh Bakes)`
- `unassigned`: `"..." (...) was taken off your list by Marketing Demo`
- `updated`: `Marketing Demo changed "..." (...)`
- `deleted`: `Marketing Demo deleted "..." (...)`
- `submitted`: `Anu Mathew submitted "..." (...) for approval`
- `approved`: `Marketing Demo approved "..." (...)`
- `sent_back`: `Marketing Demo sent back "..." (...): Please make the logo bigger…`

### `GET /notifications`

Query: `unread` (true: only unread), `limit` (default 20, max 100), `offset`. `200`:

```json
{
  "items": [
    {
      "id": 41,
      "type": "sent_back",
      "message": "Marketing Demo sent back \"Festive offer poster 3\" (Fresh Bakes): Please make the logo bigger…",
      "is_read": false,
      "created_at": "2026-10-06T09:00:00Z",
      "task": { "id": 7, "month": "2026-10", "client": { "id": 1, "name": "Fresh Bakes" } }
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0,
  "unread_count": 3
}
```

Newest first. `task` is `null` when the card was deleted. **`unread_count` is always the whole bell,
whatever the page or the filter**: the bell's number comes from this same request. `total` is the
count of the (filtered) list. `401` without a session or for a deactivated person.

### `PATCH /notifications/{id}/read`

`200` the notification, now `is_read: true`. Doing it twice is fine. Someone else's line, or one that
does not exist, is `404` (not `403`: it is none of their business).

### `POST /notifications/read-all`

Marks all of the signed-in person's lines read. `204`.

## Reports

Admin only (`401` without a session or for a deactivated admin, `403` for a member). The
dashboard replaces the report that used to be typed by hand every evening.

### Status history (`task_events`)

A daily report needs to know **when** things happened, and a card only remembers its last
change. So the backend keeps a history, one row each time a card's status changes, or a card is given to a designer or loses its designer:

| column | meaning |
|---|---|
| `id` | |
| `task_id` | the card |
| `kind` | `status` (the card was created, or its status changed), `assigned` (the card got its first designer) or `unassigned` (its designer was taken off) |
| `from_status` | `null` for the first row, when the card was created |
| `to_status` | `todo`, `ongoing`, `submitted`, `fix` or `done`. On `assigned` and `unassigned` rows it equals `from_status` (the status does not change) |
| `actor_id` | who did it |
| `created_at` | when (UTC) |

Write a row **in the same transaction** as the change, in every place one happens: creating a
card (a `status` row, `null` to `todo`, and an `assigned` row too if it was created with a
designer), giving a card that had no designer its first one (`assigned`), taking the designer
off (`unassigned`), and every move in `PATCH /tasks/{id}/status` (`status`).
Changing a card from one designer to another, or editing its text, writes nothing. Use the same timestamp for the `reviews` row of an approval
or rejection. Index `(created_at)` and `(task_id)`. Rows of deleted cards are ignored.

### `GET /reports/summary`

Query: `period` (`day` or `month`, required), then `date` (`YYYY-MM-DD`, default today in
IST) for a day, or `month` (`YYYY-MM`, default this month) for a month.

- `422` `"Choose day or month."`, `"Enter a valid date."`, `"Enter a valid month."`

```json
{
  "period": "day",
  "date": "2026-10-06",
  "month": "2026-10",
  "from": "2026-10-06",
  "to": "2026-10-06",
  "status_counts": { "todo": 9, "ongoing": 7, "submitted": 4, "fix": 1, "done": 23 },
  "unassigned": 2,
  "activity": { "created": 3, "assigned": 2, "started": 4, "submitted": 5, "approved": 3, "sent_back": 1 },
  "plan": { "target": 60, "written": 44, "delivered": 23 },
  "overdue": 3,
  "by_client": [
    {
      "client": { "id": 3, "name": "Kerala Spice", "is_archived": false },
      "target": 10, "written": 4, "delivered": 2, "remaining": 8,
      "overdue": 2, "late": 2,
      "activity": { "submitted": 0, "approved": 1 }
    }
  ],
  "by_designer": [
    {
      "designer": { "id": 11, "name": "Anu Mathew" },
      "todo": 1, "ongoing": 2, "submitted": 1, "fix": 0, "delivered": 5,
      "activity": { "started": 1, "submitted": 2, "approved": 1, "sent_back": 0 }
    }
  ]
}
```

**What each number means** (the dashboard prints these, so they must not drift):

- `month`: the month the numbers are about. For a day it is the month of that day.
- `from` and `to`: the first and last day of the period, in IST.
- `status_counts`: the **month's own cards** (cards whose `month` is this month) by their
  status **right now**.
- `unassigned`: how many of those cards have no designer (`assigned_to` is null). They are also
  counted in `status_counts.todo`, so the number of cards waiting for a designer is `unassigned`
  and the number a designer has not started is `status_counts.todo - unassigned`.
- `activity`: counted from `task_events` whose IST date is inside the period, for cards that
  still exist. `created` = `from_status` is null. `assigned` = `kind` is `assigned`. `started` =
  to `ongoing`. `submitted` = to `submitted`. `approved` = to `done`. `sent_back` = to `fix`.
  Anything else (a designer being taken off a card) is not counted. **The day is the day in India:**
  an event at 18:45 UTC on the 6th is 00:15 on the 7th.
- `plan.target`: the sum of the clients' monthly plans for that month. `written`: the month's
  cards. `delivered`: the month's `done` cards.
- `overdue`: all unfinished cards, any month, whose `deadline` is before today.
- `by_client`: every client that has a plan or cards for the month, **except** an archived
  client with no cards that month (the same rule as `GET /clients/overview`). `remaining` =
  `target` minus `delivered`, never below zero. `overdue` and `late` (unfinished cards of
  earlier months) are right now. `activity` is for the period. Sorted: most `overdue`, then
  most `remaining`, then name. **"Behind" on the dashboard means `overdue` above zero.**
- `by_designer`: every **active** Design member, plus anyone who still holds a card (a
  deactivated designer with cards stays on the report). `todo`, `ongoing`, `submitted`, `fix`
  are their unfinished cards of **any month**, right now. `delivered` is the month's `done`
  cards that are theirs. `activity` counts events on cards that are theirs. Sorted by name.

Everything marked "right now" is the state at the moment of the request, also for a report
about a day in the past: the backend does not rebuild old states. Do the counting in SQL
(`GROUP BY`), not in Python loops.

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

- `actions` and enforcement agree: for every card a user can see and every status, the move is in
  `actions.moves` exactly when `PATCH /tasks/{id}/status` lets the user make it. (The frontend's
  dummy API passes this check for every role and card: use it as the model.)
- `actions.can_edit`, `can_delete` and `can_assign` are false once a card is past `todo`, and false
  for a designer; an admin's `moves` on a card nobody holds is empty.

- Content types: `GET` without a session is `401`; `POST` needs `can_manage_clients` (`403`);
  `PATCH` is admin only (`403` for Marketing, and before any other check); duplicate names ignoring
  case are `409` but a type may re-case its own name; an unknown id is `404`; an empty body is `200`
  and changes nothing.
- Content types: renaming one renames the cards titled `<old name> <n>`, keeps typed titles, and does
  not change their `updated_at`. A type turned off can stay in a plan that has it and still gets cards,
  but cannot be added to a new client's plan or to a plan that does not have it (`422`).
- Cards: `PATCH /tasks/{id}` without `updated_at` is `422`, with an old one `409`; replaying the same
  request twice makes the second one `409`; assigning a designer needs and moves `updated_at` too.

- Profile picture: `PUT /users/me/avatar` with a text file named `.png` is `422`; over 1 MB is
  `422`; success replaces the file and changes `avatar_url`; `DELETE` goes back to the Google photo;
  nobody can change another person's picture (there is no such route).
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
  a deadline after the posting date, and a new or changed deadline in the past give `422`
  (an old, already-passed deadline can stay while other fields are edited); nothing is saved
  when validation fails.
- Cards: assigning or unassigning never changes `status`; a new card is `todo` with `assigned_to` null; a card with no designer cannot be moved to `ongoing` (`409`), not even by an admin.
- Cards: a Design member only lists cards assigned to them (or written by them); another
  member's card is `404`, not `403`.
- Overview: target 12, written 8, done 5 gives to_write 4, delivery_remaining 7, to_design 3;
  extra cards give `extra`; a type missing from the plan has `target` 0; archived clients
  appear only for months where they have cards; changing a plan from next month does not
  change this month's overview.
- Cards: deleting is only possible for `todo` cards (`409` after that), needs
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
- Cards: `limit` above 500 is capped at 500; `total` still reports the full count.
- Users: every `/users` and `/teams` endpoint is `401` without a session, `403` for a member,
  and `401` for an admin who was deactivated a moment ago (the saved row decides, not the token).
- Users: create stores the email in lower case; a duplicate is `409` even when it differs only by
  case, by dots or by a `+tag` on a Gmail address, but two different non-Gmail addresses that
  differ only by dots are different people.
- Users: a member needs a valid team, an admin must have none; changing role clears or demands
  the team; list filters (`search`, `role`, `team_id`, `is_active`) and paging work together.
- Users: nobody can change their own role or email or deactivate themselves (`409`); the last
  active admin cannot be demoted or deactivated (`409`); the email of someone else can be changed
  but not to one that is taken.
- Sign-in: an unknown email is `403`, a deactivated one is `403` with its own message, an added one
  works with different case, dots and `+tag`; `/auth/me` returns the saved role and team and `401`
  after deactivation.
- Assignable users: new Design members appear, deactivated ones and people who moved to Marketing
  disappear, and cards keep showing the name of someone who was deactivated.
- Reports: admin only (401 / 403); a bad `period`, date or month is 422 with its message.
- Reports: every card's history starts with a `null` to `todo` row, follows its moves in order, and
  its last `status` row is the card's current status; giving a card its first designer writes an
  `assigned` row and taking the designer off writes an `unassigned` row, a swap from one designer to
  another or an edit of text writes none; a refused move writes none.
- Reports: the day is the day in India (an event at 18:45 UTC on the 6th is counted on the 7th, one
  at 18:15 UTC on the 7th is still the 7th).
- Reports: the monthly numbers agree with counting the cards by hand; archived clients without
  cards that month are left out; an idle active designer still has a row; a deactivated designer
  with cards keeps theirs; a deleted card disappears from every number.
- Notifications: each trigger tells exactly the people in the table, never the person who did it,
  never a deactivated person, never an admin about a submission; refused or empty changes tell nobody.
- Notifications: replacing a designer sends two lines, changing the brief and the designer together
  sends one, deleting a card with a designer sends a line with `task` null.
- Notifications: the list is the caller's own, newest first, `unread_count` ignores paging and the
  `unread` filter, someone else's line is 404 on mark-read, mark-read twice is fine, read-all only
  touches the caller's own lines.
- Cards: a card created without a title (or a blank one) is named `<type> <n>`, numbered per client, month
  and type; a title that is given is kept and uses up no number; deleting a card never makes two cards
  share a name; names that merely look alike (`Poster 12 extra`) are ignored when counting.
- Cards: changing the type or month renames a card that has the app's own name, keeps a chosen name, and
  an explicit `title` always wins; editing other fields renames nothing.
- Cards: `notes` are optional, trimmed, at most 2000 characters, can be changed and emptied, and changing
  them tells the designer (`updated`) while saving the same notes tells nobody.
