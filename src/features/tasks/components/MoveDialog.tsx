import { Modal } from "../../../components/ui/Modal";
import { STATUS_LABEL } from "../lib/taskStatus";

import type { Task, TaskStatus } from "../types/taskTypes";

// What picking each destination will do next, so there are no surprises
function getHint(task: Task, to: TaskStatus): string {
  switch (to) {
    case "ongoing":
      return "Start working on it";
    case "submitted":
      return task.status === "fix"
        ? "Resubmit the corrected design"
        : "Add the link to your design";
    case "done":
      return "Approve the design";
    case "fix":
      return "Say what needs fixing";
    case "todo":
      return "";
  }
}

interface MoveDialogProps {
  task: Task;
  // The statuses this person may move the card to
  moves: TaskStatus[];
  onChoose: (to: TaskStatus) => void;
  onClose: () => void;
}

// "Move to…": the same moves as dragging, in a list. This is how it works on a
// phone (dragging is awkward on a small screen) and with a keyboard or a
// screen reader.
export function MoveDialog({ task, moves, onChoose, onClose }: MoveDialogProps) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Move card"
      description={task.title}
      className="max-w-sm"
    >
      <ul className="space-y-2">
        {moves.map((to) => (
          <li key={to}>
            <button
              type="button"
              onClick={() => onChoose(to)}
              className="flex w-full flex-col items-start gap-0.5 rounded-2xl border border-border bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
            >
              <span className="text-sm font-medium">{STATUS_LABEL[to]}</span>
              <span className="text-xs text-muted-foreground">
                {getHint(task, to)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
