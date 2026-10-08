import { beforeAll, describe, expect, it } from "vitest";

import { makeTask, person } from "../../../test/fixtures";
import { freshApi, type Api } from "../../../test/dummyEnv";

import type { TaskStatus } from "../types/taskTypes";

// The table of who may do what with a card. These are the rules the real
// backend has to follow, written as cases a pytest file can copy.

let api: Api;

beforeAll(async () => {
  api = await freshApi();
});

const ALL_STATUSES: TaskStatus[] = ["todo", "ongoing", "submitted", "fix", "done"];

function actionsFor(
  who: "admin" | "marketing" | "designer" | "anu",
  status: TaskStatus,
  assignedTo: "anu" | "nobody",
) {
  const user = api.users.findUser(api.ids[who]);
  const task = makeTask({
    status,
    assigned_to: assignedTo === "anu" ? person(api.ids.anu, "Anu Mathew") : null,
  });

  return api.rules.getTaskActions(user, task);
}

const movesOf = (actions: ReturnType<typeof actionsFor>) =>
  actions.moves.map((move) => `${move.status}:${move.input}`);

describe("card actions", () => {
  it("lets the writer edit, delete and assign a card only while it is 'todo'", () => {
    for (const status of ALL_STATUSES) {
      const actions = actionsFor("marketing", status, "nobody");
      const isTodo = status === "todo";

      expect(actions.can_edit, status).toBe(isTodo);
      expect(actions.can_delete, status).toBe(isTodo);
      expect(actions.can_assign, status).toBe(isTodo);
    }
  });

  it("gives a designer no edit, delete or assign rights, whatever the status", () => {
    for (const status of ALL_STATUSES) {
      const actions = actionsFor("anu", status, "anu");

      expect(actions.can_edit, status).toBe(false);
      expect(actions.can_delete, status).toBe(false);
      expect(actions.can_assign, status).toBe(false);
    }
  });

  it("lets an admin do everything on a 'todo' card", () => {
    const actions = actionsFor("admin", "todo", "nobody");

    expect(actions.can_edit && actions.can_delete && actions.can_assign).toBe(true);
  });
});

describe("card moves", () => {
  it("lets only the card's own designer start it, and says what each move asks for", () => {
    expect(movesOf(actionsFor("anu", "todo", "anu"))).toEqual(["ongoing:null"]);
    expect(movesOf(actionsFor("anu", "ongoing", "anu"))).toEqual(["submitted:file_link"]);
    expect(movesOf(actionsFor("anu", "fix", "anu"))).toEqual(["submitted:optional_file_link"]);
  });

  it("does not let another designer move somebody else's card", () => {
    for (const status of ALL_STATUSES) {
      expect(actionsFor("designer", status, "anu").moves, status).toEqual([]);
    }
  });

  it("lets a reviewer approve or send back a submitted card, with a reason for sending back", () => {
    expect(movesOf(actionsFor("marketing", "submitted", "anu"))).toEqual([
      "done:null",
      "fix:comment",
    ]);
  });

  it("does not give a reviewer the designer's moves", () => {
    expect(actionsFor("marketing", "todo", "anu").moves).toEqual([]);
    expect(actionsFor("marketing", "ongoing", "anu").moves).toEqual([]);
    expect(actionsFor("marketing", "fix", "anu").moves).toEqual([]);
  });

  it("lets nobody, an admin included, start a card no designer holds", () => {
    expect(actionsFor("admin", "todo", "nobody").moves).toEqual([]);
    expect(actionsFor("anu", "todo", "nobody").moves).toEqual([]);
  });

  it("lets an admin make any move in the table on a card that has a designer", () => {
    expect(movesOf(actionsFor("admin", "todo", "anu"))).toEqual(["ongoing:null"]);
    expect(movesOf(actionsFor("admin", "submitted", "anu"))).toEqual(["done:null", "fix:comment"]);
  });

  it("has no move out of 'done'", () => {
    for (const who of ["admin", "marketing", "anu"] as const) {
      expect(actionsFor(who, "done", "anu").moves, who).toEqual([]);
    }
  });

  it("answers the same on the move check and on the list of allowed moves", () => {
    for (const status of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        for (const who of ["admin", "marketing", "designer", "anu"] as const) {
          const user = api.users.findUser(api.ids[who]);
          const task = makeTask({ status, assigned_to: person(api.ids.anu, "Anu Mathew") });

          expect(api.rules.getAllowedMoves(user, task).includes(to)).toBe(
            api.rules.canMove(user, task, to),
          );
        }
      }
    }
  });
});
