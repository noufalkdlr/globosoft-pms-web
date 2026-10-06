import { useCan } from "../../../hooks/useCan";
import { getMarketingSections } from "../lib/homeSections";
import { HomeSection } from "./HomeSection";
import { NextMonthCard } from "./NextMonthCard";
import { StatTile } from "./StatTile";

import type { Task } from "../../tasks/types/taskTypes";

interface MarketingHomeProps {
  tasks: Task[];
  currentMonth: string;
  today: string;
}

// Marketing's day: what waits for their approval, what was sent back, what is
// due, and whether next month's content is getting written
export function MarketingHome({ tasks, currentMonth, today }: MarketingHomeProps) {
  // The next-month card links to the calendar, which needs this permission
  const canWriteContent = useCan("can_create_content");
  const sections = getMarketingSections(tasks, today, currentMonth);
  const shared = { currentMonth, today };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Waiting for approval" value={sections.waiting.length} attention />
        <StatTile label="In correction" value={sections.correction.length} />
        <StatTile label="Without a designer" value={sections.unassigned.length} attention />
        <StatTile label="Due today or overdue" value={sections.pendingToday.length} attention />
      </div>

      {canWriteContent && <NextMonthCard />}

      <div className="grid gap-6 lg:grid-cols-2">
        <HomeSection
          title="Waiting for approval"
          tasks={sections.waiting}
          emptyText="Nothing is waiting for your approval."
          showAssignee
          {...shared}
        />
        <HomeSection
          title="Due today or overdue"
          tasks={sections.pendingToday}
          emptyText="Nothing is due today."
          showAssignee
          {...shared}
        />
        <HomeSection
          title="In correction"
          tasks={sections.correction}
          emptyText="No card is waiting for a correction."
          showAssignee
          showNote
          {...shared}
        />
        <HomeSection
          title="Ongoing"
          tasks={sections.ongoing}
          emptyText="No card is being worked on right now."
          showAssignee
          {...shared}
        />
      </div>
    </div>
  );
}
