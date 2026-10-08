import { StatTile } from "../../../components/ui/StatTile";
import { useCan } from "../../../hooks/useCan";
import { ROUTES } from "../../../lib/routes";
import { getMarketingSections } from "../lib/homeSections";
import { HomeSection } from "./HomeSection";
import { NextMonthCard } from "./NextMonthCard";

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
  // Red only when something is really past its deadline; due today is yellow
  const overdueCount = sections.pendingToday.filter(
    (task) => task.deadline !== null && task.deadline < today,
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile href={ROUTES.board} label="Waiting for approval" value={sections.waiting.length} tone="warning" />
        <StatTile href={ROUTES.board} label="In correction" value={sections.correction.length} />
        <StatTile href={ROUTES.board} label="Without a designer" value={sections.unassigned.length} tone="warning" />
        <StatTile
          href={ROUTES.board}
          label="Due today or overdue"
          value={sections.pendingToday.length}
          tone={overdueCount > 0 ? "danger" : "warning"}
        />
      </div>

      {canWriteContent && <NextMonthCard />}

      <div className="grid gap-6 lg:grid-cols-2">
        <HomeSection
          title="Waiting for approval"
          tasks={sections.waiting}
          emptyText="Nothing is waiting for your approval."
          showStatus={false}
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
          showStatus={false}
          showAssignee
          showNote
          {...shared}
        />
        <HomeSection
          title="Ongoing"
          tasks={sections.ongoing}
          emptyText="No card is being worked on right now."
          showStatus={false}
          showAssignee
          {...shared}
        />
      </div>
    </div>
  );
}
