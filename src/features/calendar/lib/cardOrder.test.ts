import { describe, expect, it } from "vitest";

import { makeTask } from "../../../test/fixtures";
import { sortCardsForWriter } from "./cardOrder";

const poster = { id: 1, name: "Poster", is_active: true };
const reel = { id: 2, name: "Reel", is_active: true };

describe("writer's card order", () => {
  it("goes type by type in the order of the plan, then by the number in the name", () => {
    const cards = [
      makeTask({ id: 1, title: "Reel 1", content_type: reel }),
      makeTask({ id: 2, title: "Poster 10", content_type: poster }),
      makeTask({ id: 3, title: "Poster 2", content_type: poster }),
      makeTask({ id: 4, title: "Poster 1", content_type: poster }),
    ];

    const sorted = sortCardsForWriter(cards, new Map([[1, 0], [2, 1]]));

    expect(sorted.map((card) => card.title)).toEqual([
      "Poster 1",
      "Poster 2",
      "Poster 10",
      "Reel 1",
    ]);
  });

  it("puts cards with a title somebody typed after the numbered ones", () => {
    const cards = [
      makeTask({ id: 1, title: "Onam special", content_type: poster }),
      makeTask({ id: 2, title: "Poster 1", content_type: poster }),
    ];

    expect(
      sortCardsForWriter(cards, new Map([[1, 0]])).map((card) => card.title),
    ).toEqual(["Poster 1", "Onam special"]);
  });

  it("puts a type that is not in the plan last, and does not change the input", () => {
    const cards = [
      makeTask({ id: 1, title: "Reel 1", content_type: reel }),
      makeTask({ id: 2, title: "Poster 1", content_type: poster }),
    ];

    const sorted = sortCardsForWriter(cards, new Map([[1, 0]]));

    expect(sorted.map((card) => card.id)).toEqual([2, 1]);
    expect(cards.map((card) => card.id)).toEqual([1, 2]);
  });
});
