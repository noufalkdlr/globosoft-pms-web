import type { PlanItem, PlanItemInput } from "../types/clientTypes";

// Form state and rules for the monthly plan editor. Kept free of React so the
// rules can be tested on their own.

export const MAX_PLAN_ROWS = 12;
export const MAX_COUNT = 999;

export interface PlanRowState {
  key: string;
  // "" until a content type is chosen
  contentTypeId: string;
  // Text while the user is typing
  count: string;
  // Not null while this row is creating a brand new content type
  newTypeName: string | null;
}

export interface PlanRowErrors {
  type?: string;
  count?: string;
}

let nextKey = 1;

export function createPlanRow(partial: Partial<PlanRowState> = {}): PlanRowState {
  return {
    key: `plan-row-${nextKey++}`,
    contentTypeId: "",
    count: "",
    newTypeName: null,
    ...partial,
  };
}

export function rowsFromPlan(plan: PlanItem[]): PlanRowState[] {
  return plan.map((item) =>
    createPlanRow({
      contentTypeId: String(item.content_type.id),
      count: String(item.count),
    }),
  );
}

export function planToInputs(plan: PlanItem[]): PlanItemInput[] {
  return plan.map((item) => ({
    content_type_id: item.content_type.id,
    count: item.count,
  }));
}

// A row the user never touched is ignored instead of being reported as an error
export function isRowEmpty(row: PlanRowState): boolean {
  return row.contentTypeId === "" && row.count.trim() === "";
}

export function validateRows(
  rows: PlanRowState[],
): Record<string, PlanRowErrors> {
  const errors: Record<string, PlanRowErrors> = {};
  const seenTypes = new Set<string>();

  for (const row of rows) {
    if (isRowEmpty(row)) {
      continue;
    }

    const rowErrors: PlanRowErrors = {};

    if (row.contentTypeId === "") {
      rowErrors.type = "Choose a content type.";
    } else if (seenTypes.has(row.contentTypeId)) {
      rowErrors.type = "This type is already in the plan.";
    } else {
      seenTypes.add(row.contentTypeId);
    }

    const count = row.count.trim();

    if (!/^\d+$/.test(count) || Number(count) < 1 || Number(count) > MAX_COUNT) {
      rowErrors.count = `Enter 1 to ${MAX_COUNT}.`;
    }

    if (rowErrors.type || rowErrors.count) {
      errors[row.key] = rowErrors;
    }
  }

  return errors;
}

// Call only after validateRows found no errors
export function toPlanItems(rows: PlanRowState[]): PlanItemInput[] {
  return rows
    .filter((row) => !isRowEmpty(row))
    .map((row) => ({
      content_type_id: Number(row.contentTypeId),
      count: Number(row.count.trim()),
    }));
}

// Compares two plans regardless of row order
export function plansEqual(a: PlanItemInput[], b: PlanItemInput[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const byType = (items: PlanItemInput[]) =>
    [...items].sort((x, y) => x.content_type_id - y.content_type_id);

  const sortedA = byType(a);
  const sortedB = byType(b);

  return sortedA.every(
    (item, index) =>
      item.content_type_id === sortedB[index].content_type_id &&
      item.count === sortedB[index].count,
  );
}
