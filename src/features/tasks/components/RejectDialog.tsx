import { useId, useState, type FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Textarea } from "../../../components/ui/Textarea";
import { getErrorMessage } from "../../../lib/api/errors";

import type { useChangeTaskStatus } from "../hooks/useChangeTaskStatus";
import type { Task } from "../types/taskTypes";

const MAX_COMMENT_LENGTH = 1000;

interface RejectDialogProps {
  task: Task;
  changeStatus: ReturnType<typeof useChangeTaskStatus>;
  onClose: () => void;
}

// A reviewer sends a card back and says what to fix. The designer sees this
// note on the card. Mount it only while it is open.
export function RejectDialog({ task, changeStatus, onClose }: RejectDialogProps) {
  const formId = useId();

  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string>();
  const [error, setError] = useState<string>();

  const isSaving = changeStatus.isPending;

  function requestClose() {
    if (!isSaving) {
      onClose();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const trimmed = comment.trim();

    if (!trimmed) {
      setCommentError("Tell the designer what to fix.");
      return;
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setCommentError(`Use ${MAX_COMMENT_LENGTH} characters or fewer.`);
      return;
    }

    setCommentError(undefined);
    setError(undefined);

    changeStatus.mutate(
      {
        id: task.id,
        data: { status: "fix", updated_at: task.updated_at, comment: trimmed },
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
      title="Send back for correction"
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
          <Button type="submit" form={formId} loading={isSaving}>
            Send back
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        <Textarea
          label="What should be fixed?"
          rows={5}
          placeholder="Be specific: the designer sees this on the card."
          data-autofocus
          value={comment}
          error={commentError}
          disabled={isSaving}
          onChange={(event) => {
            setComment(event.target.value);
            setCommentError(undefined);
          }}
        />
      </form>
    </Modal>
  );
}
