import { beforeEach, describe, expect, it } from "vitest";

import { cardRequest, freshApi, refusal, type Api } from "../../../test/dummyEnv";
import { addDaysToIsoDate, getTodayIst } from "../../../utils/date";
import { addMonths, getCurrentMonth } from "../../../utils/month";

import type { Task, TaskStatus } from "../types/taskTypes";

// The rules the backend must enforce on cards, as cases: who may do what, what
// is checked in which order, and the exact words a refused person reads.
// A pytest file can copy these one by one.

let api: Api;

beforeEach(async () => {
  api = await freshApi();
});

// The writer makes a card and (optionally) hands it to a designer
function writeCard(overrides: Record<string, unknown> = {}): Task {
  api.signInAs(api.ids.marketing);

  return api.tasks.createTask(cardRequest(api, overrides));
}

// A card with Anu, as the writer would hand it over
const assignedCard = () => writeCard({ assigned_to: api.ids.anu });

function move(card: Task, status: TaskStatus, extra: Record<string, unknown> = {}) {
  return api.tasks.changeTaskStatus(card.id, {
    status,
    updated_at: card.updated_at,
    ...extra,
  });
}

const LINK = "https://drive.example.com/file/1";

describe("who may create a card", () => {
  it("refuses a designer, and anyone who is not signed in", () => {
    api.signInAs(api.ids.marketing);
    const request = cardRequest(api);

    api.signInAs(api.ids.anu);
    expect(refusal(() => api.tasks.createTask(request))).toEqual({
      status: 403,
      detail: "You don't have permission to add cards.",
    });

    api.signOut();
    expect(refusal(() => api.tasks.createTask(request)).status).toBe(401);
  });

  it("starts every card in 'todo', with or without a designer", () => {
    const plain = writeCard();
    const held = writeCard({ assigned_to: api.ids.anu });

    expect(plain.status).toBe("todo");
    expect(plain.assigned_to).toBeNull();
    expect(held.status).toBe("todo");
    expect(held.assigned_to?.id).toBe(api.ids.anu);
  });
});

describe("card validation", () => {
  it("refuses a past month, a month too far ahead and a bad month", () => {
    api.signInAs(api.ids.marketing);
    const month = getCurrentMonth();
    const ask = (value: string) =>
      refusal(() => api.tasks.createTask(cardRequest(api, { month: value })));

    expect(ask(addMonths(month, -1))).toEqual({
      status: 422,
      detail: "Cards can only be written for this month or later.",
    });
    expect(ask(addMonths(month, 25))).toEqual({
      status: 422,
      detail: "That month is too far ahead.",
    });
    expect(ask("2026-13").status).toBe(422);
  });

  it("refuses an impossible date and a deadline after the posting date", () => {
    api.signInAs(api.ids.marketing);
    const today = getTodayIst();
    const ask = (fields: Record<string, unknown>) =>
      refusal(() => api.tasks.createTask(cardRequest(api, fields)));

    expect(ask({ deadline: "2026-02-30" })).toEqual({
      status: 422,
      detail: "Enter dates as YYYY-MM-DD.",
    });
    expect(
      ask({
        deadline: addDaysToIsoDate(today, 5),
        posting_date: addDaysToIsoDate(today, 2),
      }),
    ).toEqual({ status: 422, detail: "The deadline can't be after the posting date." });
  });

  it("refuses a deadline in the past", () => {
    api.signInAs(api.ids.marketing);

    expect(
      refusal(() =>
        api.tasks.createTask(
          cardRequest(api, { deadline: addDaysToIsoDate(getTodayIst(), -1) }),
        ),
      ),
    ).toEqual({ status: 422, detail: "The deadline can't be in the past." });
  });

  it("refuses a designer who cannot take cards", () => {
    api.signInAs(api.ids.marketing);

    expect(
      refusal(() =>
        api.tasks.createTask(cardRequest(api, { assigned_to: api.ids.marketing })),
      ),
    ).toEqual({ status: 422, detail: "Choose a team member who can take cards." });
  });

  it("changes nothing when a card is refused", () => {
    api.signInAs(api.ids.marketing);
    const before = api.tasks.listTasks({ limit: 500 }).total;

    refusal(() => api.tasks.createTask(cardRequest(api, { deadline: "2026-02-30" })));

    expect(api.tasks.listTasks({ limit: 500 }).total).toBe(before);
  });
});

describe("card names", () => {
  it("names a card after its type and the next free number", () => {
    const first = writeCard();
    const second = writeCard();
    const typeName = first.content_type.name;
    const number = (card: Task) => Number(card.title.slice(typeName.length + 1));

    expect(first.title.startsWith(`${typeName} `)).toBe(true);
    expect(number(second)).toBe(number(first) + 1);
  });

  it("never gives out a number twice while a card holds it", () => {
    const a = writeCard();
    const b = writeCard();
    const c = writeCard();
    const typeName = a.content_type.name;
    const number = (card: Task) => Number(card.title.slice(typeName.length + 1));

    api.tasks.deleteTask(b.id);
    const next = writeCard();

    expect(number(next)).toBe(number(c) + 1);
  });

  it("keeps a title somebody typed, and does not use up a number", () => {
    const named = writeCard({ title: "  Onam   offer " });
    const plain = writeCard();

    expect(named.title).toBe("Onam offer");
    expect(plain.title).toMatch(/^\S+ \d+$/);
  });
});

describe("editing a card", () => {
  it("asks for updated_at, and refuses a stale one", () => {
    const card = writeCard();

    expect(
      refusal(() => api.tasks.updateTask(card.id, { content: "New" } as never)),
    ).toEqual({ status: 422, detail: "updated_at is required." });

    expect(
      refusal(() =>
        api.tasks.updateTask(card.id, { updated_at: "2000-01-01T00:00:00Z", content: "New" }),
      ),
    ).toEqual({
      status: 409,
      detail: "This card was changed by someone else. Refresh and try again.",
    });
  });

  it("moves updated_at forward on every write, so replaying a request fails", () => {
    const card = writeCard();
    const edited = api.tasks.updateTask(card.id, {
      updated_at: card.updated_at,
      content: "Changed",
    });

    expect(edited.content).toBe("Changed");
    expect(edited.updated_at > card.updated_at).toBe(true);
    expect(
      refusal(() =>
        api.tasks.updateTask(card.id, { updated_at: card.updated_at, content: "Again" }),
      ).status,
    ).toBe(409);
  });

  it("takes the designer off without changing the status", () => {
    const card = assignedCard();
    const freed = api.tasks.updateTask(card.id, {
      updated_at: card.updated_at,
      assigned_to: null,
    });

    expect(freed.assigned_to).toBeNull();
    expect(freed.status).toBe("todo");
  });

  it("refuses an edit once the work has started", () => {
    const card = assignedCard();
    api.signInAs(api.ids.anu);
    const started = move(card, "ongoing");

    api.signInAs(api.ids.marketing);
    expect(
      refusal(() =>
        api.tasks.updateTask(card.id, { updated_at: started.updated_at, content: "Late change" }),
      ),
    ).toEqual({
      status: 409,
      detail: "This card is already in progress, so it can't be edited.",
    });
  });

  it("refuses a designer's edit with 403 before it says anything else", () => {
    const card = assignedCard();
    api.signInAs(api.ids.anu);

    expect(
      refusal(() =>
        api.tasks.updateTask(card.id, { updated_at: card.updated_at, content: "Mine" }),
      ),
    ).toEqual({ status: 403, detail: "You don't have permission to edit cards." });
  });
});

describe("moving a card", () => {
  it("runs the whole road: start, submit with a link, send back with a reason, resubmit, approve", () => {
    const card = assignedCard();

    api.signInAs(api.ids.anu);
    const ongoing = move(card, "ongoing");
    expect(ongoing.status).toBe("ongoing");

    const submitted = move(ongoing, "submitted", { file_link: LINK });
    expect(submitted.file_link).toBe(LINK);

    api.signInAs(api.ids.marketing);
    const sentBack = move(submitted, "fix", { comment: "Make the logo bigger" });
    expect(sentBack.status).toBe("fix");
    expect(sentBack.latest_review).toMatchObject({
      decision: "rejected",
      comment: "Make the logo bigger",
    });

    api.signInAs(api.ids.anu);
    const again = move(sentBack, "submitted");
    expect(again.file_link).toBe(LINK);

    api.signInAs(api.ids.marketing);
    const done = move(again, "done", { comment: "Lovely" });
    expect(done.status).toBe("done");
    expect(done.latest_review?.decision).toBe("approved");
  });

  it("refuses a stale updated_at before it looks at the move or the person", () => {
    const card = assignedCard();
    api.signInAs(api.ids.designer);

    expect(
      refusal(() =>
        api.tasks.changeTaskStatus(card.id, { status: "done", updated_at: "2000-01-01T00:00:00Z" }),
      ).status,
    ).toBe(404); // a designer cannot even see a card that is not theirs

    api.signInAs(api.ids.anu);
    expect(
      refusal(() =>
        api.tasks.changeTaskStatus(card.id, { status: "done", updated_at: "2000-01-01T00:00:00Z" }),
      ),
    ).toEqual({
      status: 409,
      detail: "This card was changed by someone else. Refresh and try again.",
    });
  });

  it("refuses a move that is not in the table with 409 and the two names", () => {
    const card = assignedCard();
    api.signInAs(api.ids.anu);

    expect(refusal(() => move(card, "done"))).toEqual({
      status: 409,
      detail: 'A card that is "To do" can\'t move to "Done".',
    });
  });

  it("refuses to start a card nobody holds, even for an admin", () => {
    const card = writeCard();
    api.signInAs(api.ids.admin);

    expect(refusal(() => move(card, "ongoing"))).toEqual({
      status: 409,
      detail: "Give this card to a designer before moving it.",
    });
  });

  it("refuses 403 when the person may not make a move that exists", () => {
    const card = assignedCard();
    api.signInAs(api.ids.marketing);

    expect(refusal(() => move(card, "ongoing"))).toEqual({
      status: 403,
      detail: "You don't have permission to move this card.",
    });
  });

  it("asks for a link on submitting and a reason on sending back", () => {
    const card = assignedCard();
    api.signInAs(api.ids.anu);
    const ongoing = move(card, "ongoing");

    expect(refusal(() => move(ongoing, "submitted"))).toEqual({
      status: 422,
      detail: "Add the link to your finished design.",
    });
    expect(refusal(() => move(ongoing, "submitted", { file_link: "not a link" })).status).toBe(422);

    const submitted = move(ongoing, "submitted", { file_link: LINK });
    api.signInAs(api.ids.marketing);

    expect(refusal(() => move(submitted, "fix"))).toEqual({
      status: 422,
      detail: "Tell the designer what to fix.",
    });
    expect(refusal(() => move(submitted, "fix", { comment: "x".repeat(1001) })).status).toBe(422);
  });

  it("leaves the card as it was when a move is refused", () => {
    const card = assignedCard();
    api.signInAs(api.ids.anu);
    const ongoing = move(card, "ongoing");

    refusal(() => move(ongoing, "submitted"));

    const stored = api.tasks.listTasks({ limit: 500 }).items.find((item) => item.id === card.id);
    expect(stored?.status).toBe("ongoing");
    expect(stored?.updated_at).toBe(ongoing.updated_at);
  });
});

describe("deleting a card", () => {
  it("deletes a 'todo' card for the writer only", () => {
    const card = writeCard();

    api.signInAs(api.ids.anu);
    expect(refusal(() => api.tasks.deleteTask(card.id)).status).toBe(404);

    api.signInAs(api.ids.marketing);
    api.tasks.deleteTask(card.id);
    expect(refusal(() => api.tasks.deleteTask(card.id))).toEqual({
      status: 404,
      detail: "Card not found.",
    });
  });

  it("refuses once the work has started", () => {
    const card = assignedCard();
    api.signInAs(api.ids.anu);
    move(card, "ongoing");

    api.signInAs(api.ids.marketing);
    expect(refusal(() => api.tasks.deleteTask(card.id))).toEqual({
      status: 409,
      detail: "This card is already in progress, so it can't be deleted.",
    });
  });
});

describe("who sees which cards", () => {
  it("shows a designer only their own cards, and the writer and an admin all of them", () => {
    const mine = writeCard({ assigned_to: api.ids.anu });
    const theirs = writeCard({ assigned_to: api.ids.rahul });

    api.signInAs(api.ids.anu);
    const seenByAnu = api.tasks.listTasks({ limit: 500 }).items.map((card) => card.id);
    expect(seenByAnu).toContain(mine.id);
    expect(seenByAnu).not.toContain(theirs.id);

    for (const who of [api.ids.marketing, api.ids.admin]) {
      api.signInAs(who);
      const seen = api.tasks.listTasks({ limit: 500 }).items.map((card) => card.id);
      expect(seen).toContain(mine.id);
      expect(seen).toContain(theirs.id);
    }
  });
});

describe("notifications", () => {
  const typesFor = (id: number) => api.tasks.listNotificationsFor(id).map((line) => line.type);

  it("tells a designer when a card is given to them, and when it is taken away", () => {
    const card = writeCard();
    const before = typesFor(api.ids.anu).length;

    api.signInAs(api.ids.marketing);
    const given = api.tasks.updateTask(card.id, {
      updated_at: card.updated_at,
      assigned_to: api.ids.anu,
    });
    expect(typesFor(api.ids.anu)[0]).toBe("assigned");

    api.tasks.updateTask(card.id, { updated_at: given.updated_at, assigned_to: null });
    expect(typesFor(api.ids.anu)[0]).toBe("unassigned");
    expect(typesFor(api.ids.anu).length).toBe(before + 2);
  });

  it("tells the reviewers (not the admin) about a submission, and the designer about the verdict", () => {
    const card = assignedCard();
    const reviewerBefore = typesFor(api.ids.marketing).length;
    const adminBefore = typesFor(api.ids.admin).length;

    api.signInAs(api.ids.anu);
    const ongoing = move(card, "ongoing");
    const submitted = move(ongoing, "submitted", { file_link: LINK });

    expect(typesFor(api.ids.marketing)[0]).toBe("submitted");
    expect(typesFor(api.ids.marketing).length).toBe(reviewerBefore + 1);
    expect(typesFor(api.ids.admin).length).toBe(adminBefore);

    api.signInAs(api.ids.marketing);
    const sentBack = move(submitted, "fix", { comment: "Please make the logo bigger" });
    const line = api.tasks.listNotificationsFor(api.ids.anu)[0];
    expect(line.type).toBe("sent_back");
    expect(line.message).toContain("Please make the logo bigger");

    api.signInAs(api.ids.anu);
    const again = move(sentBack, "submitted");
    api.signInAs(api.ids.marketing);
    move(again, "done");
    expect(typesFor(api.ids.anu)[0]).toBe("approved");
  });

  it("tells the designer when their 'todo' card is deleted, and the line no longer links to a card", () => {
    const card = assignedCard();

    api.signInAs(api.ids.marketing);
    api.tasks.deleteTask(card.id);

    const line = api.tasks.listNotificationsFor(api.ids.anu)[0];
    expect(line.type).toBe("deleted");
    expect(line.task).toBeNull();
  });
});

describe("actions and enforcement agree", () => {
  const STATUSES: TaskStatus[] = ["todo", "ongoing", "submitted", "fix", "done"];

  it("lists a move in `actions.moves` exactly when the status endpoint lets the person make it", () => {
    // Every card the sample data holds, for every signed-in person, to every status
    for (const who of ["designer", "anu", "rahul", "meera", "marketing", "admin"] as const) {
      api.signInAs(api.ids[who]);
      const cards = api.tasks.listTasks({ limit: 500 }).items;

      for (const card of cards) {
        const allowed = card.actions.moves.map((item) => item.status);
        const refused = STATUSES.filter((status) => !allowed.includes(status));

        // Everything not offered must be refused (403 or 409), and change nothing
        for (const status of refused) {
          const answer = refusal(() =>
            api.tasks.changeTaskStatus(card.id, {
              status,
              updated_at: card.updated_at,
              file_link: LINK,
              comment: "Please fix",
            }),
          );

          expect([403, 409], `${who} ${card.status} -> ${status}`).toContain(answer.status);
        }

        // The first move offered must work (it changes the card, so only one per card)
        if (allowed.length > 0) {
          const moved = api.tasks.changeTaskStatus(card.id, {
            status: allowed[0],
            updated_at: card.updated_at,
            file_link: LINK,
            comment: "Please fix",
          });

          expect(moved.status, `${who} ${card.status} -> ${allowed[0]}`).toBe(allowed[0]);
        }
      }
    }
  });
});
