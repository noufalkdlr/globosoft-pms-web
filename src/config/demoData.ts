// TEMPORARY, like the dummy API files it serves: delete together with them
// when the real backend is connected.
//
// Which demo data the app starts with. Set `VITE_DEMO_DATA` in a file named
// `.env.local` (it is not committed) and restart `npm run dev`:
//
//   VITE_DEMO_DATA=empty    no clients, cards or history. Four people (George,
//                           Ramseena, Deepak, Noufal) to try every role with.
//   VITE_DEMO_DATA=sample   (the default) a lived-in office: clients, cards,
//                           reports and notifications to look at.
//
// Each mode keeps its own saved data in the browser, so switching back and
// forth never mixes them or loses anything.

export type DemoDataMode = "sample" | "empty";

export const DEMO_DATA_MODE: DemoDataMode =
  import.meta.env.VITE_DEMO_DATA === "empty" ? "empty" : "sample";

// The localStorage key for one kind of saved data ("users", "tasks", ...).
// The sample mode keeps the names it always had.
export function demoStorageKey(name: string): string {
  return DEMO_DATA_MODE === "empty" ? `pms-empty-${name}` : `pms-dummy-${name}`;
}
