import { describe, expect, it } from "vitest";

import { makeTask, person } from "../../../test/fixtures";
import { filterBoardTasks, getDesignerOptions } from "./boardFilters";

const anu = person(11, "Anu Mathew");
const rahul = person(12, "Rahul Krishnan");

const tasks = [
  makeTask({ id: 1, title: "Poster 1", assigned_to: anu }),
  makeTask({ id: 2, title: "Poster 2", assigned_to: anu }),
  makeTask({ id: 3, title: "Reel 1", assigned_to: rahul, content: "Onam offer" }),
  makeTask({ id: 4, title: "Story 1", assigned_to: null, client: { id: 2, name: "Urban Gym" } }),
];

const ids = (list: ReturnType<typeof makeTask>[]) => list.map((task) => task.id);

describe("designer options", () => {
  it("counts who holds the cards, sorted by name, and the cards nobody holds", () => {
    expect(getDesignerOptions(tasks)).toEqual({
      unassigned: 1,
      people: [
        { id: 11, name: "Anu Mathew", count: 2 },
        { id: 12, name: "Rahul Krishnan", count: 1 },
      ],
    });
  });
});

describe("board filters", () => {
  it("shows everything with no filter", () => {
    expect(ids(filterBoardTasks(tasks, { designer: null, search: "" }))).toEqual([1, 2, 3, 4]);
  });

  it("filters by one designer, or by 'no designer'", () => {
    expect(ids(filterBoardTasks(tasks, { designer: 11, search: "" }))).toEqual([1, 2]);
    expect(ids(filterBoardTasks(tasks, { designer: "unassigned", search: "" }))).toEqual([4]);
  });

  it("searches the title, client, written content and designer, ignoring case", () => {
    const search = (text: string) =>
      ids(filterBoardTasks(tasks, { designer: null, search: text }));

    expect(search("  REEL ")).toEqual([3]);
    expect(search("urban")).toEqual([4]);
    expect(search("onam")).toEqual([3]);
    expect(search("rahul")).toEqual([3]);
    expect(search("nothing like this")).toEqual([]);
  });

  it("combines the designer and the search", () => {
    expect(ids(filterBoardTasks(tasks, { designer: 11, search: "poster 2" }))).toEqual([2]);
  });
});
