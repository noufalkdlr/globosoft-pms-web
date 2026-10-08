# Tests

```
npm test            run every test once
npm run test:watch  re-run on every save
```

They run in Node with a browser-like `localStorage` (Vitest + jsdom). No browser is opened.

## What is tested

- **Small logic the website keeps:** email, month and date helpers (the month changes at
  midnight in India), the board's filters, the writer's card order.
- **The rules the backend must enforce**, through the dummy API files in `src/features/*/api/`:
  who may do what with a card (`dummyTaskRules.test.ts`), what is checked in which order and the
  exact words a refused person reads (`dummyTasks.test.ts`), users (`dummyUsers.test.ts`),
  clients and plans (`dummyClients.test.ts`).

## Why the second kind matters

The dummy API is the reference the real FastAPI backend is written against. Each of these tests
is one case a pytest file can copy: sign in as this person, send this request, expect this
status and these words. When the backend exists, the same cases move to pytest, and the dummy
files (and their tests) are deleted together with them.

`actions and enforcement agree` is the most important one: for every card in the sample data
and every person, a move is listed in `Task.actions.moves` exactly when the status endpoint
lets them make it. The backend needs the same test.

## Writing a test for a dummy API

`src/test/dummyEnv.ts` gives each test a clean office:

```ts
const api = await freshApi();           // fresh data, fresh module state
api.signInAs(api.ids.marketing);        // who is asking
refusal(() => api.tasks.createTask(…)); // → { status: 403, detail: "…" }
```

A test that changes a rule should fail when the rule is broken: remove the rule once and check
that the test goes red before trusting it.
