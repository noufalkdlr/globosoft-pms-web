#!/usr/bin/env node
// Writes docs/api-errors.md: every error the dummy API raises, grouped by the
// endpoint it answers. The dummy files are the reference implementation of the
// backend, and the frontend shows the `detail` text to people as it is, so the
// exact words are part of the contract.
//
//   node scripts/api-errors.mjs            rewrite docs/api-errors.md
//   node scripts/api-errors.mjs --check    exit 1 if the file is out of date
//
// Run it whenever a dummy API file changes. Add an endpoint to ENDPOINTS below
// when a new dummy function stands in for one.

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUTPUT = join(ROOT, "docs/api-errors.md");

// exported dummy function -> the endpoint it stands in for, in reading order
const ENDPOINTS = [
  ["Auth", "POST /auth/google", "googleAuthApi"],
  ["Auth", "GET /auth/me", "meApi"],
  ["Users", "GET /users/assignable", "listAssignableUsers"],
  ["Users", "GET /users", "listUsers"],
  ["Users", "POST /users", "createUser"],
  ["Users", "PATCH /users/{id}", "updateUser"],
  ["Users", "PUT /users/me/avatar", "setMyAvatar"],
  ["Users", "DELETE /users/me/avatar", "removeMyAvatar"],
  ["Teams", "GET /teams", "listTeams"],
  ["Content types", "GET /content-types", "listContentTypesForUser"],
  ["Content types", "POST /content-types", "createContentType"],
  ["Content types", "PATCH /content-types/{id}", "updateContentType"],
  ["Clients", "GET /clients", "listClients"],
  ["Clients", "POST /clients", "createClient"],
  ["Clients", "PATCH /clients/{id}", "updateClient"],
  ["Clients", "GET /clients/overview", "computeMonthOverview"],
  ["Cards", "GET /tasks", "listTasks"],
  ["Cards", "POST /tasks", "createTask"],
  ["Cards", "PATCH /tasks/{id}", "updateTask"],
  ["Cards", "PATCH /tasks/{id}/status", "changeTaskStatus"],
  ["Cards", "DELETE /tasks/{id}", "deleteTask"],
  ["Notifications", "GET /notifications", "listNotifications"],
  ["Notifications", "PATCH /notifications/{id}/read", "markRead"],
  ["Notifications", "POST /notifications/read-all", "markAllRead"],
  ["Reports", "GET /reports/summary", "getReportSummary"],
];

// Expressions inside a message, written the way a person reads them
const EXPRESSIONS = {
  "STATUS_LABEL[row.status]": "current status",
  "STATUS_LABEL[request.status]": "requested status",
};

// Said by every endpoint that needs a session: written once, not per endpoint
const GENERAL = new Set(["401|Not authenticated"]);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

// Top-level functions: they start at the beginning of a line and end at the
// first line that is just "}" (the code is formatted that way)
function parseFunctions(file, text) {
  const functions = [];
  const start = /^(?:export )?(?:async )?function (\w+)\s*\(/gm;
  let match;

  while ((match = start.exec(text))) {
    const end = text.indexOf("\n}\n", match.index);
    const body = text.slice(match.index, end === -1 ? text.length : end + 2);
    functions.push({ name: match[1], file, body });
  }

  return functions;
}

// const MAX_NAME_LENGTH = 40;  ->  { MAX_NAME_LENGTH: "40" }
function parseConstants(text) {
  const constants = {};

  for (const m of text.matchAll(/^const (\w+) = (\d+);/gm)) {
    constants[m[1]] = m[2];
  }

  return constants;
}

function unescape(literal) {
  return literal.replace(/\\(["'`\\])/g, "$1").replace(/\s+/g, " ").trim();
}

function errorsIn(body, constants) {
  const found = [];

  // requireAdmin("Only admins can see the reports.") raises a 403 with the words
  // it is given, or with its own default words when it is called with none
  const adminDefault = all
    .find((fn) => fn.name === "requireAdmin")
    ?.body.match(/deniedMessage = "((?:[^"\\]|\\.)*)"/)?.[1];

  for (const m of body.matchAll(/\brequireAdmin\(\s*(?:"((?:[^"\\]|\\.)*)")?\s*\)/g)) {
    found.push({ status: 403, message: unescape(m[1] ?? adminDefault ?? "Admins only.") });
  }

  const call = /fakeApiError\(\s*(\d{3})\s*,\s*(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;

  for (const m of body.matchAll(call)) {
    let message = m[2].slice(1, -1);

    message = message.replace(/\$\{\s*([^}]+?)\s*\}/g, (_, expression) =>
      constants[expression] ?? `{${EXPRESSIONS[expression] ?? expression}}`,
    );
    found.push({ status: Number(m[1]), message: unescape(message) });
  }

  return found;
}

const files = walk(join(ROOT, "src")).filter(
  (file) => file.endsWith(".ts") && readFileSync(file, "utf8").includes("fakeApiError("),
);

const all = [];
const constantsByFile = new Map();

for (const file of files) {
  const text = readFileSync(file, "utf8");
  constantsByFile.set(file, parseConstants(text));
  all.push(...parseFunctions(file, text));
}

// A function name that exists once in the whole app can be followed across files
const countByName = new Map();
for (const fn of all) {
  countByName.set(fn.name, (countByName.get(fn.name) ?? 0) + 1);
}

function callees(fn) {
  const result = [];

  for (const other of all) {
    if (other === fn) continue;

    const sameFile = other.file === fn.file;
    const unique = countByName.get(other.name) === 1;

    if ((sameFile || unique) && new RegExp(`\\b${other.name}\\s*\\(`).test(fn.body.slice(fn.body.indexOf("{")))) {
      result.push(other);
    }
  }

  return result;
}

function reach(entry) {
  const seen = new Set([entry]);
  const queue = [entry];

  while (queue.length) {
    for (const next of callees(queue.shift())) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }

  return [...seen];
}

const sections = new Map();
let total = 0;

for (const [area, endpoint, functionName] of ENDPOINTS) {
  const candidates = all.filter((fn) => fn.name === functionName);

  if (candidates.length !== 1) {
    console.error(`ENDPOINTS: "${functionName}" for ${endpoint} matches ${candidates.length} functions`);
    process.exit(2);
  }

  const messages = new Map();

  for (const fn of reach(candidates[0])) {
    for (const { status, message } of errorsIn(fn.body, constantsByFile.get(fn.file))) {
      const key = `${status}|${message}`;

      if (!GENERAL.has(key)) {
        messages.set(key, { status, message });
      }
    }
  }

  const rows = [...messages.values()].sort(
    (a, b) => a.status - b.status || a.message.localeCompare(b.message),
  );
  total += rows.length;

  if (!sections.has(area)) sections.set(area, []);
  sections.get(area).push({ endpoint, rows });
}

const lines = [
  "# API errors",
  "",
  "<!-- Generated by `node scripts/api-errors.mjs`. Do not edit by hand: change the dummy API, then run it again. -->",
  "",
  "Every error the dummy API raises, grouped by the endpoint that can answer it. The dummy API is",
  "the reference implementation of the backend, so the backend should answer the **same status with",
  "the same words**: the frontend shows `detail` to people as it is.",
  "",
  "- Body is always `{ \"detail\": \"message\" }`. Words in `{braces}` are filled in by the backend.",
  "- `401` `\"Not authenticated\"` comes from every endpoint except `POST /auth/google` when there is no",
  "  session, or the person was deactivated since they signed in.",
  "- A `404` is also what a card or user the person may not see answers: it must look the same as",
  "  one that does not exist.",
  "- Rules that are not in this list (a `403` for a permission, for example) are in `api-contract.md`.",
  "  The checks of one endpoint run in the order its section in the contract gives.",
  "",
];

for (const [area, endpoints] of sections) {
  lines.push(`## ${area}`, "");

  for (const { endpoint, rows } of endpoints) {
    lines.push(`### \`${endpoint}\``, "");

    if (rows.length === 0) {
      lines.push("No errors of its own (only the general ones above).", "");
      continue;
    }

    lines.push("| status | detail |", "|---|---|");
    for (const { status, message } of rows) {
      lines.push(`| \`${status}\` | ${message.replace(/\|/g, "\\|")} |`);
    }
    lines.push("");
  }
}

const output = lines.join("\n").replace(/\n+$/, "\n");

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(OUTPUT, "utf8");
  } catch {
    // missing file counts as out of date
  }

  if (current !== output) {
    console.error("docs/api-errors.md is out of date. Run: node scripts/api-errors.mjs");
    process.exit(1);
  }

  console.log("docs/api-errors.md is up to date");
} else {
  writeFileSync(OUTPUT, output);
  console.log(`${relative(ROOT, OUTPUT)}: ${total} errors across ${ENDPOINTS.length} endpoints`);
}
