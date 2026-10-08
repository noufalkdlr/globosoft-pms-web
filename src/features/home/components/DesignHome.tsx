import { StatTile } from "../../../components/ui/StatTile";
import { ROUTES } from "../../../lib/routes";
import { getDesignSections } from "../lib/homeSections";
import { HomeSection } from "./HomeSection";

import type { Task } from "../../tasks/types/taskTypes";

interface DesignHomeProps {
  tasks: Task[];
  currentMonth: string;
  today: string;
}

// A designer's day: the corrections to make first (they are stuck work), then
// the cards to work on, most urgent first. The cards are already only the
// designer's own.
export function DesignHome({ tasks, currentMonth, today }: DesignHomeProps) {
  const sections = getDesignSections(tasks);
  const shared = { currentMonth, today };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile href={ROUTES.board} label="To do" value={sections.todo.length} />
        <StatTile href={ROUTES.board} label="Ongoing" value={sections.ongoing.length} />
        <StatTile href={ROUTES.board} label="Correction" value={sections.correction.length} tone="warning" />
        <StatTile href={ROUTES.board} label="Waiting for approval" value={sections.waiting.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HomeSection
          title="Corrections"
          tasks={sections.correction}
          emptyText="No corrections. Nice work."
          showStatus={false}
          showNote
          {...shared}
        />
        <HomeSection
          title="My tasks"
          tasks={sections.myTasks}
          emptyText="Nothing to work on right now."
          {...shared}
        />
      </div>
    </div>
  );
}
