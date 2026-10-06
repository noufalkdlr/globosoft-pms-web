import { useId } from "react";
import { Link } from "react-router";

import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { ROUTES } from "../../../lib/routes";
import { HomeTaskRow } from "./HomeTaskRow";

import type { Task } from "../../tasks/types/taskTypes";

// How many cards a section shows before pointing to the board
const DEFAULT_LIMIT = 5;

interface HomeSectionProps {
  title: string;
  tasks: Task[];
  emptyText: string;
  currentMonth: string;
  today: string;
  limit?: number;
  showAssignee?: boolean;
  showNote?: boolean;
}

// A titled list of cards for the Home page
export function HomeSection({
  title,
  tasks,
  emptyText,
  currentMonth,
  today,
  limit = DEFAULT_LIMIT,
  showAssignee = false,
  showNote = false,
}: HomeSectionProps) {
  const headingId = useId();
  const hidden = tasks.length - limit;

  return (
    <GlassCard role="region" aria-labelledby={headingId} className="p-4">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 id={headingId} className="text-sm font-medium">
          {title}
        </h2>
        <Badge aria-label={`${tasks.length} cards`}>{tasks.length}</Badge>
      </div>

      {tasks.length === 0 ? (
        <p className="px-1 py-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <>
          <ul>
            {tasks.slice(0, limit).map((task) => (
              <li key={task.id}>
                <HomeTaskRow
                  task={task}
                  currentMonth={currentMonth}
                  today={today}
                  showAssignee={showAssignee}
                  showNote={showNote}
                />
              </li>
            ))}
          </ul>

          {hidden > 0 && (
            <Link
              to={ROUTES.board}
              className="mt-1 block rounded-xl px-3 py-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {hidden} more on the board
            </Link>
          )}
        </>
      )}
    </GlassCard>
  );
}
