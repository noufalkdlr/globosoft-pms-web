import type { Task } from "../types/taskTypes";

// "unassigned" = cards no designer has yet, a number = one designer's cards,
// null = everyone's
export type DesignerFilter = "unassigned" | number | null;

export interface BoardFilters {
  designer: DesignerFilter;
  search: string;
}

export interface DesignerOption {
  id: number;
  name: string;
  count: number;
}

// Who holds the cards on the board right now, for the Designer dropdown. Read
// from the cards themselves, so the list is always exactly the people who have
// something on this board.
export function getDesignerOptions(tasks: Task[]): {
  unassigned: number;
  people: DesignerOption[];
} {
  const people = new Map<number, DesignerOption>();
  let unassigned = 0;

  for (const task of tasks) {
    if (!task.assigned_to) {
      unassigned += 1;
      continue;
    }

    const known = people.get(task.assigned_to.id);

    if (known) {
      known.count += 1;
    } else {
      people.set(task.assigned_to.id, {
        id: task.assigned_to.id,
        name: task.assigned_to.name,
        count: 1,
      });
    }
  }

  return {
    unassigned,
    people: [...people.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

// The cards that pass the filters. Cards have no title of their own to search
// ("Poster 3"), so the search also reads what the writer wrote.
export function filterBoardTasks(
  tasks: Task[],
  { designer, search }: BoardFilters,
): Task[] {
  const needle = search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (designer === "unassigned" && task.assigned_to !== null) {
      return false;
    }

    if (typeof designer === "number" && task.assigned_to?.id !== designer) {
      return false;
    }

    if (!needle) {
      return true;
    }

    const text = [
      task.title,
      task.client.name,
      task.content,
      task.notes,
      task.assigned_to?.name ?? "",
    ]
      .join("\n")
      .toLowerCase();

    return text.includes(needle);
  });
}
