import { getDesignSections } from "../lib/homeSections";
import { HomeSection } from "./HomeSection";
import { StatTile } from "./StatTile";

import type { Task } from "../../tasks/types/taskTypes";

interface DesignHomeProps {
  tasks: Task[];
  currentMonth: string;
  today: string;
}

// A designer's day: the cards to work on, the corrections to make and what is
// due soon. The cards are already only the designer's own.
export function DesignHome({ tasks, currentMonth, today }: DesignHomeProps) {
  const sections = getDesignSections(tasks, today);
  const shared = { currentMonth, today };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="To do" value={sections.todo.length} />
        <StatTile label="Ongoing" value={sections.ongoing.length} />
        <StatTile label="Correction" value={sections.correction.length} attention />
        <StatTile label="Waiting for approval" value={sections.waiting.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HomeSection
          title="My tasks"
          tasks={sections.myTasks}
          emptyText="Nothing to work on right now."
          {...shared}
        />
        <HomeSection
          title="Corrections"
          tasks={sections.correction}
          emptyText="No corrections. Nice work."
          showNote
          {...shared}
        />
        <div className="lg:col-span-2">
          <HomeSection
            title="Due soon"
            tasks={sections.dueSoon}
            emptyText="Nothing is due in the next few days."
            {...shared}
          />
        </div>
      </div>
    </div>
  );
}
