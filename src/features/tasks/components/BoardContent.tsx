import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { MonthSwitcher } from "../../../components/ui/MonthSwitcher";
import { Select } from "../../../components/ui/Select";
import { useCan } from "../../../hooks/useCan";
import { getTodayIst } from "../../../utils/date";
import { formatMonth, getCurrentMonth } from "../../../utils/month";
import { useClients } from "../../clients/hooks/useClients";
import { useBoardCards } from "../hooks/useBoardCards";
import { useBoardParams } from "../hooks/useBoardParams";
import { BOARD_COLUMNS } from "../lib/taskStatus";
import { BoardColumn } from "./BoardColumn";

import type { Task, TaskStatus } from "../types/taskTypes";

const ALL_CLIENTS = "all";

function BoardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading the board"
      className="flex gap-4 overflow-hidden"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="w-72 shrink-0 space-y-2.5">
          <div className="h-8 animate-pulse rounded-xl bg-white/5" />
          {Array.from({ length: 3 }, (_, card) => (
            <GlassCard key={card} className="h-28 animate-pulse p-3.5" />
          ))}
        </div>
      ))}
    </div>
  );
}

function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = {
    new: [],
    todo: [],
    ongoing: [],
    submitted: [],
    fix: [],
    done: [],
  };

  // The API already sorts by deadline, so each column keeps that order
  for (const task of tasks) {
    groups[task.status].push(task);
  }

  return groups;
}

export function BoardContent() {
  const { month, clientId, setMonth, setClientId } = useBoardParams();

  // Managers see every card, everyone else only their own (the backend decides)
  // Both hooks run every time (never `a || useB()`, which skips a hook)
  const canAssign = useCan("can_assign");
  const canReview = useCan("can_review");
  const seesEverything = canAssign || canReview;

  const cardsQuery = useBoardCards(month, clientId);
  const clientsQuery = useClients({ is_archived: false, limit: 100 });

  const tasks = cardsQuery.data?.items ?? [];
  const groups = groupByStatus(tasks);
  const today = getTodayIst();

  const clients = clientsQuery.data?.items ?? [];
  // A client in the URL that is not in the (active) list, e.g. an archived
  // one: still shown in the dropdown so it never points at nothing
  const isListed = clients.some((client) => client.id === clientId);
  const unlistedClient =
    clientId !== null && !isListed
      ? (tasks.find((task) => task.client.id === clientId)?.client ??
        (clientsQuery.isSuccess
          ? { id: clientId, name: "Selected client" }
          : undefined))
      : undefined;

  function renderBoard() {
    if (cardsQuery.isPending) {
      return <BoardSkeleton />;
    }

    if (cardsQuery.isError) {
      return (
        <MessageCard
          title="Couldn't load the board"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: () => cardsQuery.refetch() }}
        />
      );
    }

    if (tasks.length === 0) {
      return (
        <MessageCard
          title={`No cards for ${formatMonth(month)}`}
          description={
            seesEverything
              ? "Cards written in the content calendar show up here."
              : "Cards given to you show up here."
          }
        />
      );
    }

    return (
      <>
        {/* Keyboard users can scroll the columns sideways */}
        <div
          role="region"
          aria-label="Board columns"
          tabIndex={0}
          className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8"
        >
          {BOARD_COLUMNS.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={groups[status]}
              boardMonth={month}
              today={today}
            />
          ))}
        </div>

        {cardsQuery.data && cardsQuery.data.total > tasks.length && (
          <p className="mt-2 text-sm text-muted-foreground">
            Showing the first {tasks.length} of {cardsQuery.data.total} cards.
            Pick a client to narrow the board.
          </p>
        )}
      </>
    );
  }

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Task board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {seesEverything
              ? "Every card, by stage."
              : "Your cards, by stage."}
          </p>
        </div>

        <MonthSwitcher
          month={month}
          currentMonth={getCurrentMonth()}
          onChange={setMonth}
        />
      </header>

      <div className="mt-6 max-w-xs">
        <Select
          label="Client"
          value={clientId === null ? ALL_CLIENTS : String(clientId)}
          onChange={(event) =>
            setClientId(
              event.target.value === ALL_CLIENTS
                ? null
                : Number(event.target.value),
            )
          }
        >
          <option value={ALL_CLIENTS}>All clients</option>
          {unlistedClient && (
            <option value={unlistedClient.id}>{unlistedClient.name}</option>
          )}
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6">{renderBoard()}</div>
    </div>
  );
}
