import { useState } from "react";
import { DragDropContext, type DragStart, type DropResult } from "@hello-pangea/dnd";

import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { MonthSwitcher } from "../../../components/ui/MonthSwitcher";
import { SearchInput } from "../../../components/ui/SearchInput";
import { Select } from "../../../components/ui/Select";
import { useCan } from "../../../hooks/useCan";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { getErrorMessage } from "../../../lib/api/errors";
import { toast } from "../../../stores/toastStore";
import { getTodayIst } from "../../../utils/date";
import { formatMonth, getCurrentMonth } from "../../../utils/month";
import { useClients } from "../../clients/hooks/useClients";
import { useBoardCards } from "../hooks/useBoardCards";
import { useBoardParams } from "../hooks/useBoardParams";
import { useChangeTaskStatus } from "../hooks/useChangeTaskStatus";
import { filterBoardTasks, getDesignerOptions } from "../lib/boardFilters";
import { BOARD_COLUMNS, STATUS_LABEL } from "../lib/taskStatus";
import { AssignDialog } from "./AssignDialog";
import { BoardColumn, type DropState } from "./BoardColumn";
import { MoveDialog } from "./MoveDialog";
import { RejectDialog } from "./RejectDialog";
import { SubmitDialog } from "./SubmitDialog";
import { TaskDetailsDialog } from "./TaskDetailsDialog";

import type { Task, TaskStatus } from "../types/taskTypes";

const ALL_CLIENTS = "all";
const ALL_DESIGNERS = "all";
const WITHOUT_DESIGNER = "unassigned";

// Which dialog is open, and for which card. At most one at a time.
type ActiveDialog =
  | { kind: "move"; task: Task }
  | { kind: "assign"; task: Task }
  | { kind: "submit"; task: Task }
  | { kind: "reject"; task: Task };

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

  // Cards nobody holds yet come first in "To do": they are the ones waiting
  // for a person to act. The sort is stable, so each half keeps its deadline order.
  groups.todo.sort(
    (a, b) => Number(a.assigned_to !== null) - Number(b.assigned_to !== null),
  );

  return groups;
}

export function BoardContent() {
  const { month, clientId, designer, setMonth, setClientId, setDesigner, clearFilters } =
    useBoardParams();
  // Searching is quick and temporary, so it stays out of the URL
  const [search, setSearch] = useState("");
  // "Done" is folded into a strip unless the screen is wide enough to show all
  // five columns; a person's own choice (null = no choice yet) wins
  const isRoomy = useMediaQuery("(min-width: 1700px)");
  const [doneChoice, setDoneChoice] = useState<boolean | null>(null);
  const isDoneCollapsed = doneChoice ?? !isRoomy;

  // Managers see every card, everyone else only their own (the backend decides)
  // Both hooks run every time (never `a || useB()`, which skips a hook)
  const canAssign = useCan("can_assign");
  const canReview = useCan("can_review");
  const seesEverything = canAssign || canReview;

  const cardsQuery = useBoardCards(month, clientId);
  const clientsQuery = useClients({ is_archived: false, limit: 100 });
  const changeStatus = useChangeTaskStatus();

  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  // The card whose details are open. Kept as an id, so the details follow the
  // card when it is updated or moved while open.
  const [detailsId, setDetailsId] = useState<number | null>(null);
  // The card being dragged, so every column can say whether it accepts it
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Everything the month returned, and the part of it that passes the filters
  const allTasks = cardsQuery.data?.items ?? [];
  const tasks = filterBoardTasks(allTasks, { designer, search });
  // The client filter is applied by the server, so the line "Showing 3 of 12"
  // only matters for the two filters applied here
  const hasLocalFilters = designer !== null || search.trim() !== "";
  const designerOptions = getDesignerOptions(allTasks);
  const isDesignerListed =
    typeof designer !== "number" ||
    designerOptions.people.some((person) => person.id === designer);
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

  // Looked up among every card, so the details stay open if a filter would hide it
  const detailsTask =
    detailsId === null ? undefined : allTasks.find((task) => task.id === detailsId);

  // Who may move a card where is the backend's call: it comes with the card
  const getMoves = (task: Task) => task.actions.moves.map((move) => move.status);
  const allowedMoves = draggedTask ? getMoves(draggedTask) : [];
  const busyTaskId = changeStatus.isPending
    ? changeStatus.variables?.id
    : undefined;

  function getDropState(status: TaskStatus): DropState {
    if (!draggedTask || status === draggedTask.status) {
      return "idle";
    }

    return allowedMoves.includes(status) ? "allowed" : "blocked";
  }

  // The one place a move starts, whether it came from a drop or from the
  // "Move to…" list. Moves that need more (a link, a reason) open the
  // matching dialog first; the others happen at once.
  function requestMove(task: Task, to: TaskStatus) {
    const move = task.actions.moves.find((candidate) => candidate.status === to);

    if (!move) {
      const options = task.actions.moves.map((candidate) => STATUS_LABEL[candidate.status]);

      toast.error(
        options.length === 0
          ? `You can't move ${task.title}.`
          : `${task.title} can only go to ${options.join(" or ")}.`,
      );
      return;
    }

    switch (move.input) {
      case "file_link":
      case "optional_file_link":
        setDialog({ kind: "submit", task });
        return;
      case "comment":
        setDialog({ kind: "reject", task });
        return;
      default:
        changeStatus.mutate(
          { id: task.id, data: { status: to, updated_at: task.updated_at } },
          // The card has already jumped back; say why
          { onError: (error) => toast.error(getErrorMessage(error)) },
        );
    }
  }

  function handleDragStart(start: DragStart) {
    setDraggedTask(tasks.find((task) => String(task.id) === start.draggableId) ?? null);
  }

  function handleDragEnd(result: DropResult) {
    setDraggedTask(null);

    const { destination, source, draggableId } = result;

    // Dropped outside a column, or back where it came from: nothing to do
    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const task = tasks.find((candidate) => String(candidate.id) === draggableId);

    if (task) {
      requestMove(task, destination.droppableId as TaskStatus);
    }
  }

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

    if (allTasks.length > 0 && tasks.length === 0) {
      return (
        <MessageCard
          title="No cards match"
          description="Try a different search, or clear the filters."
          action={{
            label: "Clear filters",
            onClick: () => {
              clearFilters();
              setSearch("");
            },
          }}
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
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Keyboard users reach the columns through the cards in them, and the
              page scrolls sideways to follow the focus: the strip itself needs
              no Tab stop (it would only show a focus line across the page) */}
          <div
            role="region"
            aria-label="Board columns"
            className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8"
          >
            {BOARD_COLUMNS.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                tasks={groups[status]}
                boardMonth={month}
                today={today}
                dropState={getDropState(status)}
                getMoves={getMoves}
                busyTaskId={busyTaskId}
                onMove={(task) => setDialog({ kind: "move", task })}
                onAssign={(task) => setDialog({ kind: "assign", task })}
                onOpen={(task) => setDetailsId(task.id)}
                showAssignee={seesEverything}
                collapsed={status === "done" ? isDoneCollapsed : undefined}
                onToggleCollapsed={
                  status === "done"
                    ? () => setDoneChoice(!isDoneCollapsed)
                    : undefined
                }
              />
            ))}
          </div>
        </DragDropContext>

        {cardsQuery.data && cardsQuery.data.total > allTasks.length && (
          <p className="mt-2 text-sm text-muted-foreground">
            Showing the first {allTasks.length} of {cardsQuery.data.total} cards.
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-48">
          <Select
            aria-label="Client"
            className="h-10"
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

        {/* Everyone else only has their own cards, so there is nothing to pick */}
        {seesEverything && (
          <div className="w-full sm:w-48">
            <Select
              aria-label="Designer"
              className="h-10"
              value={
                designer === null
                  ? ALL_DESIGNERS
                  : designer === WITHOUT_DESIGNER
                    ? WITHOUT_DESIGNER
                    : String(designer)
              }
              onChange={(event) => {
                const value = event.target.value;

                setDesigner(
                  value === ALL_DESIGNERS
                    ? null
                    : value === WITHOUT_DESIGNER
                      ? WITHOUT_DESIGNER
                      : Number(value),
                );
              }}
            >
              <option value={ALL_DESIGNERS}>All designers</option>
              {(designerOptions.unassigned > 0 || designer === WITHOUT_DESIGNER) && (
                <option value={WITHOUT_DESIGNER}>
                  Without a designer ({designerOptions.unassigned})
                </option>
              )}
              {/* A designer in the URL who has no card here: still shown, so the
                  dropdown never points at nothing */}
              {!isDesignerListed && typeof designer === "number" && (
                <option value={designer}>Selected designer (0)</option>
              )}
              {designerOptions.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} ({person.count})
                </option>
              ))}
            </Select>
          </div>
        )}

        <SearchInput
          compact
          className="w-full sm:w-64"
          label="Search cards"
          placeholder="Search cards"
          value={search}
          onChange={setSearch}
        />
      </div>

      {hasLocalFilters && cardsQuery.isSuccess && allTasks.length > 0 && (
        <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
          Showing {tasks.length} of {allTasks.length} cards.{" "}
          <button
            type="button"
            onClick={() => {
              clearFilters();
              setSearch("");
            }}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Clear filters
          </button>
        </p>
      )}

      <div className="mt-4">{renderBoard()}</div>

      {detailsTask && (
        <TaskDetailsDialog task={detailsTask} onClose={() => setDetailsId(null)} />
      )}

      {dialog?.kind === "move" && (
        <MoveDialog
          task={dialog.task}
          moves={getMoves(dialog.task)}
          onClose={() => setDialog(null)}
          onChoose={(to) => {
            setDialog(null);
            requestMove(dialog.task, to);
          }}
        />
      )}

      {dialog?.kind === "assign" && (
        <AssignDialog task={dialog.task} onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "submit" && (
        <SubmitDialog
          task={dialog.task}
          changeStatus={changeStatus}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === "reject" && (
        <RejectDialog
          task={dialog.task}
          changeStatus={changeStatus}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
