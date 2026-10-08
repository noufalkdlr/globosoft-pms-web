import { vi } from "vitest";

import { getCurrentMonth } from "../utils/month";

// The dummy API files keep their data in module variables backed by
// localStorage. A test that needs a clean office clears the storage and loads
// fresh copies of the modules, so no test sees another's changes.
export async function freshApi() {
  localStorage.clear();
  vi.resetModules();

  const [session, users, tasks, clients, contentTypes, rules] = await Promise.all([
    import("../features/auth/api/dummySession"),
    import("../features/users/api/dummyUsers"),
    import("../features/tasks/api/dummyTasks"),
    import("../features/clients/api/dummyClients"),
    import("../features/content-types/api/dummyContentTypes"),
    import("../features/tasks/api/dummyTaskRules"),
  ]);

  // Who is asking: the demo accounts, by the names on the sign-in screen
  const ids = {
    admin: 1,
    marketing: 2,
    designer: 3,
    anu: 11,
    rahul: 12,
    meera: 13,
  };

  function signInAs(id: number) {
    const user = users.findUser(id);

    if (!user) {
      throw new Error(`No demo user ${id}`);
    }

    session.writeSession(user);

    return user;
  }

  function signOut() {
    session.clearSession();
  }

  return { session, users, tasks, clients, contentTypes, rules, ids, signInAs, signOut };
}

export type Api = Awaited<ReturnType<typeof freshApi>>;

// Runs a function that should be refused and returns what the API answered, so
// a test can check the status and the exact words the person would read
export function refusal(action: () => unknown): { status: number; detail: string } {
  try {
    action();
  } catch (error) {
    const response = (error as { response?: { status: number; data: { detail: string } } })
      .response;

    if (response) {
      return { status: response.status, detail: response.data.detail };
    }

    throw error;
  }

  throw new Error("Expected the API to refuse, but it answered");
}

// A card the signed-in writer could create: this month, a client that has a plan
// for it, the first type in that plan
export function cardRequest(api: Api, overrides: Record<string, unknown> = {}) {
  const month = getCurrentMonth();
  const client = api.clients
    .listClients({ limit: 100 })
    .items.find((item) => api.clients.getPlanForMonth(item.id, month).length > 0);

  if (!client) {
    throw new Error("The sample data has no client with a plan this month");
  }

  const plan = api.clients.getPlanForMonth(client.id, month);

  return {
    client_id: client.id,
    content_type_id: plan[0].content_type.id,
    month,
    content: "Caption and talking points",
    ...overrides,
  };
}
