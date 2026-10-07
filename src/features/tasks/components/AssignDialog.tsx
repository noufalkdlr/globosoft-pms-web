import { useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { getErrorMessage } from "../../../lib/api/errors";
import { useAssignableUsers } from "../../users/hooks/useAssignableUsers";
import { useUpdateTask } from "../hooks/useUpdateTask";

import type { Task } from "../types/taskTypes";

interface AssignDialogProps {
  task: Task;
  onClose: () => void;
}

// Choose who works on a card, or take the designer off it. Mount it only
// while it is open. Shared by the content calendar and, later, the board.
export function AssignDialog({ task, onClose }: AssignDialogProps) {
  const usersQuery = useAssignableUsers();
  const updateTask = useUpdateTask();

  const currentId = task.assigned_to ? String(task.assigned_to.id) : "";
  const [assigneeId, setAssigneeId] = useState(currentId);
  const [error, setError] = useState<string>();

  const users = usersQuery.data ?? [];
  const isSaving = updateTask.isPending;

  function requestClose() {
    if (!isSaving) {
      onClose();
    }
  }

  function handleSave() {
    // Nothing changed: just close
    if (assigneeId === currentId) {
      onClose();
      return;
    }

    setError(undefined);
    updateTask.mutate(
      {
        id: task.id,
        data: {
          updated_at: task.updated_at,
          assigned_to: assigneeId ? Number(assigneeId) : null,
        },
      },
      {
        onSuccess: onClose,
        onError: (saveError) => setError(getErrorMessage(saveError)),
      },
    );
  }

  return (
    <Modal
      open
      onClose={requestClose}
      title="Assign a designer"
      description={task.title}
      className="max-w-md"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-3">
          {error && (
            <p role="alert" className="mr-auto text-sm text-destructive">
              {error}
            </p>
          )}
          <Button variant="ghost" disabled={isSaving} onClick={requestClose}>
            Cancel
          </Button>
          <Button
            loading={isSaving}
            disabled={usersQuery.isPending || usersQuery.isError}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      }
    >
      {usersQuery.isError ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-destructive">Couldn't load designers.</p>
          <Button
            variant="ghost"
            className="h-10 px-3 text-sm"
            onClick={() => usersQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <Select
          label="Designer"
          data-autofocus
          value={assigneeId}
          disabled={usersQuery.isPending || isSaving}
          onChange={(event) => setAssigneeId(event.target.value)}
        >
          {usersQuery.isPending ? (
            <option value="">Loading designers…</option>
          ) : (
            <>
              <option value="">No one yet (unassigned)</option>
              {/* Keep the current designer selectable even if they left the list */}
              {task.assigned_to &&
                !users.some((user) => user.id === task.assigned_to?.id) && (
                  <option value={task.assigned_to.id}>
                    {task.assigned_to.name}
                  </option>
                )}
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </>
          )}
        </Select>
      )}
    </Modal>
  );
}
