import { beforeEach, describe, expect, it } from "vitest";

import { freshApi, refusal, type Api } from "../../../test/dummyEnv";
import { addMonths, getCurrentMonth } from "../../../utils/month";

let api: Api;
const month = getCurrentMonth();

beforeEach(async () => {
  api = await freshApi();
});

function typeId(name = "Poster") {
  const found = api.contentTypes.listContentTypes().find((type) => type.name === name);

  if (!found) {
    throw new Error(`No content type ${name}`);
  }

  return found.id;
}

const planFor = (count = 4, effective_from_month = month) => ({
  effective_from_month,
  items: [{ content_type_id: typeId(), count }],
});

describe("who may change clients", () => {
  it("lets anyone signed in look, but only a team with can_manage_clients write", () => {
    api.signOut();
    expect(refusal(() => api.clients.listClients()).status).toBe(401);

    api.signInAs(api.ids.anu);
    expect(api.clients.listClients().total).toBeGreaterThan(0);

    for (const action of [
      () => api.clients.createClient({ name: "New client", notes: null }),
      () => api.clients.updateClient(1, { notes: "x" }),
    ]) {
      expect(refusal(action)).toEqual({
        status: 403,
        detail: "You don't have permission to manage clients.",
      });
    }

    api.signInAs(api.ids.marketing);
    expect(api.clients.createClient({ name: "New client", notes: null }).name).toBe("New client");
  });

  it("answers 403 before 404, so a stranger learns nothing about which ids exist", () => {
    api.signInAs(api.ids.anu);

    expect(refusal(() => api.clients.updateClient(9999, { notes: "x" })).status).toBe(403);

    api.signInAs(api.ids.marketing);
    expect(refusal(() => api.clients.updateClient(9999, { notes: "x" }))).toEqual({
      status: 404,
      detail: "Client not found.",
    });
  });
});

describe("client names and notes", () => {
  beforeEach(() => api.signInAs(api.ids.marketing));

  it("tidies the name and refuses a duplicate, ignoring case, archived clients included", () => {
    const created = api.clients.createClient({ name: "  Green   Leaf ", notes: null });
    expect(created.name).toBe("Green Leaf");

    expect(
      refusal(() => api.clients.createClient({ name: "green leaf", notes: null })),
    ).toEqual({ status: 409, detail: "A client with this name already exists." });

    api.clients.updateClient(created.id, { is_archived: true });
    expect(refusal(() => api.clients.createClient({ name: "GREEN LEAF", notes: null })).status).toBe(409);
  });

  it("checks the name and notes lengths and turns blank notes into null", () => {
    expect(refusal(() => api.clients.createClient({ name: " ", notes: null }))).toEqual({
      status: 422,
      detail: "Enter the client's name.",
    });
    expect(refusal(() => api.clients.createClient({ name: "x".repeat(101), notes: null })).status).toBe(422);
    expect(refusal(() => api.clients.createClient({ name: "A", notes: "x".repeat(501) })).status).toBe(422);
    expect(api.clients.createClient({ name: "Blank notes", notes: "   " }).notes).toBeNull();
  });
});

describe("plans", () => {
  beforeEach(() => api.signInAs(api.ids.marketing));

  it("refuses a plan that starts in the past, a bad count and a type twice", () => {
    const ask = (plan: ReturnType<typeof planFor>) =>
      refusal(() => api.clients.createClient({ name: `Client ${Math.random()}`, notes: null, plan }));

    expect(ask(planFor(4, addMonths(month, -1)))).toEqual({
      status: 422,
      detail: "A plan change can only start this month or later.",
    });
    expect(ask(planFor(0)).status).toBe(422);
    expect(ask(planFor(1000)).status).toBe(422);
    expect(
      ask({
        effective_from_month: month,
        items: [
          { content_type_id: typeId(), count: 2 },
          { content_type_id: typeId(), count: 3 },
        ],
      }),
    ).toEqual({ status: 422, detail: "Each content type can appear only once in a plan." });
  });

  it("starts a change from the month given and leaves earlier months alone", () => {
    const client = api.clients.createClient({ name: "Plan history", notes: null, plan: planFor(4) });
    const next = addMonths(month, 1);

    api.clients.updateClient(client.id, { plan: planFor(9, next) });

    expect(api.clients.getPlanForMonth(client.id, month)[0].count).toBe(4);
    expect(api.clients.getPlanForMonth(client.id, next)[0].count).toBe(9);
  });

  it("ends everything from a month when the list is empty", () => {
    const client = api.clients.createClient({ name: "Ends here", notes: null, plan: planFor(4) });
    const next = addMonths(month, 1);

    api.clients.updateClient(client.id, { plan: { effective_from_month: next, items: [] } });

    expect(api.clients.getPlanForMonth(client.id, month)).toHaveLength(1);
    expect(api.clients.getPlanForMonth(client.id, next)).toHaveLength(0);
  });

  it("changes nothing when part of a request is refused", () => {
    const client = api.clients.createClient({ name: "Stays put", notes: "before", plan: planFor(4) });

    refusal(() => api.clients.updateClient(client.id, { notes: "after", plan: planFor(0) }));

    const stored = api.clients.listClients({ limit: 100 }).items.find((item) => item.id === client.id);
    expect(stored?.notes).toBe("before");
  });
});
