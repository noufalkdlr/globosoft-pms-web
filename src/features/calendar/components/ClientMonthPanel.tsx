import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { useCan } from "../../../hooks/useCan";
import { getErrorMessage } from "../../../lib/api/errors";
import { ROUTES } from "../../../lib/routes";
import { toast } from "../../../stores/toastStore";
import { getTodayIst } from "../../../utils/date";
import { formatMonth, getCurrentMonth } from "../../../utils/month";
import { AssignDialog } from "../../tasks/components/AssignDialog";
import { TaskDetailsDialog } from "../../tasks/components/TaskDetailsDialog";
import { useDeleteTask } from "../../tasks/hooks/useDeleteTask";
import { CalendarTaskCard } from "./CalendarTaskCard";
import { CardFormDialog, type CardTypeOption } from "./CardFormDialog";
import { TypeProgressCard } from "./TypeProgressCard";

import type { Task } from "../../tasks/types/taskTypes";
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

  const canEdit = useCan("can_create_content");
  const canAssign = useCan("can_assign");
  const deleteTask = useDeleteTask();

  // "new" = the add form is open, a card = editing it, null = closed
  const [formTarget, setFormTarget] = useState<Task | "new" | null>(null);
  const [assignTarget, setAssignTarget] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  // The card whose details are open, kept as an id so it follows updates
  const [detailsId, setDetailsId] = useState<number | null>(null);

  const today = getTodayIst();
  const tasks = tasksQuery.data?.items ?? [];
  const detailsTask = detailsId === null ? undefined : tasks.find((task) => task.id === detailsId);

  // Cards can only be written for the types the client's plan asks for
  const typeOptions: CardTypeOption[] = overview.types
    .filter((progress) => progress.target > 0)
    .map((progress) => ({
      id: progress.content_type.id,
      name: progress.content_type.name,
      toWrite: progress.to_write,
    }));

  const isPastMonth = month < getCurrentMonth();
  const canAddCards = canEdit && !isPastMonth && typeOptions.length > 0;

  // Which card has a request in flight, so only that card's buttons are disabled
  const busyTaskId = deleteTask.isPending ? deleteTask.variables : undefined;

  function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    deleteTask.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      // The dialog stays open so the user can retry
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

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
          description={
            canAddCards
              ? "Write the first one with Add card."
              : "Cards you write for this client will show up here."
          }
          action={
            canAddCards
              ? { label: "Add card", onClick: () => setFormTarget("new") }
              : undefined
          }
        />
      );
    }

    return (
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <CalendarTaskCard
              task={task}
              today={today}
              canEdit={canEdit}
              canAssign={canAssign}
              busy={busyTaskId === task.id}
              onEdit={setFormTarget}
              onDelete={setDeleteTarget}
              onAssign={setAssignTarget}
              onOpen={(opened) => setDetailsId(opened.id)}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{client.name}</h2>
            {client.is_archived && <Badge>Archived</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatMonth(month)}
            {isPastMonth && ". Cards can only be added for this month or later."}
          </p>
        </div>

        {canAddCards && (
          <Button className="shrink-0 gap-2" onClick={() => setFormTarget("new")}>
            <Plus className="size-4" aria-hidden="true" />
            Add card
          </Button>
        )}
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

      {formTarget !== null && (
        <CardFormDialog
          client={client}
          month={month}
          typeOptions={typeOptions}
          task={formTarget === "new" ? null : formTarget}
          onClose={() => setFormTarget(null)}
        />
      )}

      {detailsTask && (
        <TaskDetailsDialog task={detailsTask} onClose={() => setDetailsId(null)} />
      )}

      {assignTarget && (
        <AssignDialog task={assignTarget} onClose={() => setAssignTarget(null)} />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this card?"
        description={`"${deleteTarget?.title ?? ""}" will be removed for good. If a designer was assigned, it disappears from their list too.`}
        confirmLabel="Delete card"
        loading={deleteTask.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
