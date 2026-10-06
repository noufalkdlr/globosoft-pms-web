import { useId, useState, type FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { getErrorMessage } from "../../../lib/api/errors";
import { isSafeLink, isValidFileLink } from "../lib/taskDates";

import type { useChangeTaskStatus } from "../hooks/useChangeTaskStatus";
import type { Task } from "../types/taskTypes";

interface SubmitDialogProps {
  task: Task;
  changeStatus: ReturnType<typeof useChangeTaskStatus>;
  onClose: () => void;
}

// The designer hands in finished work: the link to the design is required the
// first time, and optional when resubmitting a correction (the old link stays).
// Mount it only while it is open.
export function SubmitDialog({ task, changeStatus, onClose }: SubmitDialogProps) {
  const isResubmit = task.status === "fix";
  const formId = useId();

  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string>();
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

    const trimmed = link.trim();

    if (!trimmed && !isResubmit) {
      setLinkError("Add the link to your finished design.");
      return;
    }

    if (trimmed && !isValidFileLink(trimmed)) {
      setLinkError("Enter a valid link, starting with http:// or https://.");
      return;
    }

    setLinkError(undefined);
    setError(undefined);

    changeStatus.mutate(
      {
        id: task.id,
        data: {
          status: "submitted",
          updated_at: task.updated_at,
          file_link: trimmed || undefined,
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
      title={isResubmit ? "Resubmit for approval" : "Submit for approval"}
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
            {isResubmit ? "Resubmit" : "Submit"}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-3">
        {/* The visible Submit button sits outside this form (in the dialog
            footer). This invisible one makes Enter submit in every browser. */}
        <button
          type="submit"
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />

        <Input
          label={
            isResubmit
              ? "Link to the corrected design (optional)"
              : "Link to your design"
          }
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://"
          data-autofocus
          value={link}
          error={linkError}
          disabled={isSaving}
          onChange={(event) => {
            setLink(event.target.value);
            setLinkError(undefined);
          }}
        />

        {isResubmit && (
          <p className="text-xs text-muted-foreground">
            Leave it empty to keep the current link
            {isSafeLink(task.file_link) && (
              <>
                {": "}
                <a
                  href={task.file_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all underline underline-offset-2"
                >
                  {task.file_link}
                </a>
              </>
            )}
            .
          </p>
        )}
      </form>
    </Modal>
  );
}
