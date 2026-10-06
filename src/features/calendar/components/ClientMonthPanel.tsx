import { Link } from "react-router";

import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { getTodayIst } from "../../../utils/date";
import { formatMonth } from "../../../utils/month";
import { ROUTES } from "../../../lib/routes";
import { CalendarTaskCard } from "./CalendarTaskCard";
import { TypeProgressCard } from "./TypeProgressCard";

import type { useCalendarCards } from "../hooks/useCalendarCards";
import type { ClientMonthOverview } from "../types/overviewTypes";

function CardsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading cards"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <GlassCard key={index} className="h-36 animate-pulse p-4">
          <div className="h-4 w-2/3 rounded bg-white/10" />
          <div className="mt-4 h-3 w-full rounded bg-white/10" />
          <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
        </GlassCard>
      ))}
    </div>
  );
}

interface ClientMonthPanelProps {
  overview: ClientMonthOverview;
  month: string;
  // The client's cards, loaded by the page so they load alongside the overview
  tasksQuery: ReturnType<typeof useCalendarCards>;
}

export function ClientMonthPanel({
  overview,
  month,
  tasksQuery,
}: ClientMonthPanelProps) {
  const { client } = overview;

  const today = getTodayIst();
  const tasks = tasksQuery.data?.items ?? [];

  function renderCards() {
    if (tasksQuery.isPending) {
      return <CardsSkeleton />;
    }

    if (tasksQuery.isError) {
      return (
        <MessageCard
          title="Couldn't load the cards"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: () => tasksQuery.refetch() }}
        />
      );
    }

    if (tasks.length === 0) {
      return (
        <MessageCard
          title={`No cards for ${formatMonth(month)} yet`}
          description="Cards you write for this client will show up here."
        />
      );
    }

    return (
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <CalendarTaskCard task={task} today={today} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{client.name}</h2>
          {client.is_archived && <Badge>Archived</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatMonth(month)}
        </p>
      </div>

      {overview.types.length === 0 ? (
        <div className="space-y-3">
          <MessageCard
            title="No monthly plan for this month"
            description="Add what this client needs each month, and its progress will show here."
          />
          <p className="text-center text-sm text-muted-foreground">
            Set the plan under{" "}
            <Link to={ROUTES.clients} className="underline underline-offset-2">
              Clients
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {overview.types.map((progress) => (
            <li key={progress.content_type.id}>
              <TypeProgressCard progress={progress} />
            </li>
          ))}
        </ul>
      )}

      <section aria-label="Cards" className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Cards
          {tasksQuery.data && ` (${tasksQuery.data.total})`}
        </h3>
        {renderCards()}
        {tasksQuery.data && tasksQuery.data.total > tasks.length && (
          <p className="text-sm text-muted-foreground">
            Showing the first {tasks.length} of {tasksQuery.data.total} cards.
          </p>
        )}
      </section>
    </div>
  );
}
