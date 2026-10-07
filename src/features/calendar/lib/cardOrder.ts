import type { Task } from "../../tasks/types/taskTypes";

// The number a card was named with: "Poster 5" -> 5. Cards with a title
// somebody typed have none.
function cardNumber(title: string): number | null {
  const match = /(\d+)$/.exec(title);

  return match ? Number(match[1]) : null;
}

// The order a writer thinks in: type by type in the order of the client's plan,
// and inside a type by the number in the name (Poster 1, Poster 2, ...). The API
// sorts by deadline, which is right for a designer and jumbles the names here.
export function sortCardsForWriter(
  tasks: Task[],
  typeOrder: Map<number, number>,
): Task[] {
  return [...tasks].sort((a, b) => {
    const byType =
      (typeOrder.get(a.content_type.id) ?? Number.MAX_SAFE_INTEGER) -
      (typeOrder.get(b.content_type.id) ?? Number.MAX_SAFE_INTEGER);

    if (byType !== 0) {
      return byType;
    }

    const numberA = cardNumber(a.title);
    const numberB = cardNumber(b.title);

    // Numbered cards first, in number order; named ones after, by name
    if (numberA !== null && numberB !== null && numberA !== numberB) {
      return numberA - numberB;
    }

    if ((numberA === null) !== (numberB === null)) {
      return numberA === null ? 1 : -1;
    }

    return a.title.localeCompare(b.title) || a.id - b.id;
  });
}
