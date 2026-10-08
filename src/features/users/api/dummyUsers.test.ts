import { beforeEach, describe, expect, it } from "vitest";

import { freshApi, refusal, type Api } from "../../../test/dummyEnv";
import { TEAMS } from "../../teams/api/dummyTeams";

let api: Api;

beforeEach(async () => {
  api = await freshApi();
});

describe("the Users screen is for admins only", () => {
  it("answers 401 without a session and 403 to a member, in the same words", () => {
    expect(refusal(() => api.users.listUsers()).status).toBe(401);

    for (const who of [api.ids.marketing, api.ids.anu]) {
      api.signInAs(who);
      expect(refusal(() => api.users.listUsers())).toEqual({
        status: 403,
        detail: "Only admins can manage users.",
      });
    }
  });
});

describe("adding a person", () => {
  beforeEach(() => api.signInAs(api.ids.admin));

  const member = (overrides = {}) => ({
    name: "Sana Fathima",
    email: "sana.fathima@gmail.com",
    role: "member" as const,
    team_id: TEAMS.design.id,
    ...overrides,
  });

  it("stores the address in lower case and lets the person sign in with it", () => {
    const created = api.users.createUser(member({ email: "Sana.Fathima@Gmail.com" }));

    expect(created.email).toBe("sana.fathima@gmail.com");
    expect(created.is_active).toBe(true);
  });

  it("treats Gmail addresses that differ by dots, case or +tag as the same person", () => {
    api.users.createUser(member());

    for (const email of ["Sanafathima@gmail.com", "sana.fathima+pms@gmail.com", "SANA.F.athima@googlemail.com"]) {
      expect(refusal(() => api.users.createUser(member({ email })))).toEqual({
        status: 409,
        detail: "That email is already added.",
      });
    }
  });

  it("asks for a team for a member, and none for an admin", () => {
    expect(refusal(() => api.users.createUser(member({ team_id: null })))).toEqual({
      status: 422,
      detail: "Choose a team for this person.",
    });
    expect(
      refusal(() => api.users.createUser(member({ role: "admin", team_id: TEAMS.design.id }))),
    ).toEqual({ status: 422, detail: "Admins don't belong to a team." });
    expect(api.users.createUser(member({ role: "admin", team_id: null })).team).toBeNull();
  });

  it("checks the name and the address", () => {
    expect(refusal(() => api.users.createUser(member({ name: "   " })))).toEqual({
      status: 422,
      detail: "Enter the person's name.",
    });
    expect(refusal(() => api.users.createUser(member({ name: "x".repeat(81) }))).status).toBe(422);
    expect(refusal(() => api.users.createUser(member({ email: "not-an-address" })))).toEqual({
      status: 422,
      detail: "Enter a valid email address.",
    });
  });

  it("creates nothing when it refuses", () => {
    const before = api.users.listUsers({ limit: 100 }).total;

    refusal(() => api.users.createUser(member({ email: "bad" })));

    expect(api.users.listUsers({ limit: 100 }).total).toBe(before);
  });
});

describe("changing a person", () => {
  beforeEach(() => api.signInAs(api.ids.admin));

  it("never lets someone change their own role, email or active state", () => {
    expect(refusal(() => api.users.updateUser(api.ids.admin, { role: "member", team_id: 2 }))
    ).toEqual({ status: 409, detail: "There must be at least one active admin." });

    // With a second admin the safety net is quiet, and the self rules speak
    api.users.createUser({ name: "Second Admin", email: "second.admin@gmail.com", role: "admin", team_id: null });

    expect(refusal(() => api.users.updateUser(api.ids.admin, { role: "member", team_id: 2 }))).toEqual({
      status: 409,
      detail: "You can't change your own role.",
    });
    expect(refusal(() => api.users.updateUser(api.ids.admin, { is_active: false }))).toEqual({
      status: 409,
      detail: "You can't deactivate your own account.",
    });
    expect(refusal(() => api.users.updateUser(api.ids.admin, { email: "other@gmail.com" }))).toEqual({
      status: 409,
      detail: "You can't change your own email.",
    });
  });

  it("deactivates and reactivates a person, and an inactive person cannot sign in", () => {
    api.users.updateUser(api.ids.anu, { is_active: false });

    expect(api.users.findAccountByEmail("anu.mathew@gmail.com")?.isActive).toBe(false);
    expect(api.users.findActiveUser(api.ids.anu)).toBeUndefined();

    api.users.updateUser(api.ids.anu, { is_active: true });
    expect(api.users.findActiveUser(api.ids.anu)?.id).toBe(api.ids.anu);
  });

  it("needs a team when a person moves from admin to member, and clears it for admin", () => {
    api.users.createUser({ name: "Second Admin", email: "second.admin@gmail.com", role: "admin", team_id: null });
    const second = api.users.listUsers({ search: "second" }).items[0];

    expect(refusal(() => api.users.updateUser(second.id, { role: "member" }))).toEqual({
      status: 422,
      detail: "Choose a team for this person.",
    });

    const asAdmin = api.users.updateUser(api.ids.anu, { role: "admin" });
    expect(asAdmin.team).toBeNull();
  });

  it("answers 404 for a person who does not exist", () => {
    expect(refusal(() => api.users.updateUser(9999, { name: "Nobody" }))).toEqual({
      status: 404,
      detail: "User not found.",
    });
  });

  it("looks a person up by the Gmail rules at sign-in", () => {
    expect(api.users.findAccountByEmail("Anu.Mathew+pms@gmail.com")?.user.id).toBe(api.ids.anu);
    expect(api.users.findAccountByEmail("anumathew@gmail.com")?.user.id).toBe(api.ids.anu);
    expect(api.users.findAccountByEmail("stranger@gmail.com")).toBeUndefined();
  });
});

describe("who can be given cards", () => {
  it("lists only active people on the team that receives cards, sorted by name", () => {
    api.signInAs(api.ids.marketing);
    const names = api.users.listAssignableUsers().map((person) => person.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(names).not.toContain("Marketing Demo");
    expect(names).not.toContain("Admin Demo");

    api.signInAs(api.ids.admin);
    api.users.updateUser(api.ids.anu, { is_active: false });
    api.signInAs(api.ids.marketing);
    expect(api.users.listAssignableUsers().map((person) => person.name)).not.toContain("Anu Mathew");
  });

  it("is refused to people who cannot assign", () => {
    api.signInAs(api.ids.anu);

    expect(refusal(() => api.users.listAssignableUsers())).toEqual({
      status: 403,
      detail: "You don't have permission to assign cards.",
    });
  });
});

describe("profile picture", () => {
  const image = (type: string, bytes = 100) => new Blob([new Uint8Array(bytes)], { type });

  it("checks the type and size, and goes back to nothing on removal", async () => {
    api.signInAs(api.ids.anu);

    await expect(api.users.setMyAvatar(image("text/plain"))).rejects.toMatchObject({
      response: { status: 422, data: { detail: "Choose a JPEG, PNG or WebP picture." } },
    });
    await expect(api.users.setMyAvatar(image("image/png", 1024 * 1024 + 1))).rejects.toMatchObject({
      response: { status: 422, data: { detail: "Use a picture under 1 MB." } },
    });

    const updated = await api.users.setMyAvatar(image("image/webp"));
    expect(updated.has_custom_avatar).toBe(true);
    expect(updated.avatar_url).toMatch(/^data:image\/webp/);

    const removed = api.users.removeMyAvatar();
    expect(removed.has_custom_avatar).toBe(false);
    expect(removed.avatar_url).toBeNull();
  });

  it("changes only the signed-in person's own picture", async () => {
    api.signInAs(api.ids.anu);
    await api.users.setMyAvatar(image("image/png"));

    expect(api.users.findUser(api.ids.rahul)?.avatar_url).toBeNull();
    expect(api.users.findUser(api.ids.anu)?.avatar_url).not.toBeNull();
  });
});
