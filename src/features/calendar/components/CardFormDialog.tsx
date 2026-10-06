import { useEffect, useId, useState, type FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { useCan } from "../../../hooks/useCan";
import { getErrorMessage } from "../../../lib/api/errors";
import { formatMonth } from "../../../utils/month";
import { useCreateTask } from "../../tasks/hooks/useCreateTask";
import { useUpdateTask } from "../../tasks/hooks/useUpdateTask";
import { useAssignableUsers } from "../../users/hooks/useAssignableUsers";

import type { Task, TaskUpdateRequest } from "../../tasks/types/taskTypes";

const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 5000;

// A content type this client's plan asks for in the month
export interface CardTypeOption {
  id: number;
  name: string;
  // How many are still to be written (0 once the target is reached)
  toWrite: number;
}

function cleanTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

function typeLabel(option: CardTypeOption, inPlan: boolean) {
  if (!inPlan) {
    return `${option.name} (not in this month's plan)`;
  }

  return option.toWrite > 0
    ? `${option.name} (${option.toWrite} left)`
    : `${option.name} (target reached)`;
}

// The type new cards start with: the first one that still has cards to write
function defaultTypeId(options: CardTypeOption[]) {
  const next = options.find((option) => option.toWrite > 0) ?? options[0];

  return next ? String(next.id) : "";
}

interface CardFormDialogProps {
  client: { id: number; name: string };
  month: string;
  typeOptions: CardTypeOption[];
  // null = writing new cards, a card = editing it
  task: Task | null;
  onClose: () => void;
}

// Mount it only while it should be open: it reads its starting values from
// props once, so every open starts from a clean form.
//
// Adding: "Save card" saves and gives a blank form with the same content type
// and the cursor back in Title, so a month of cards can be written without
// touching the mouse. "Done" closes.
export function CardFormDialog({
  client,
  month,
  typeOptions,
  task,
  onClose,
}: CardFormDialogProps) {
  const isEdit = task !== null;
  const canAssign = useCan("can_assign");

  const formId = useId();
  const titleFieldId = useId();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const usersQuery = useAssignableUsers(canAssign);
  const isSaving = createTask.isPending || updateTask.isPending;

  const [initial] = useState(() => ({
    title: task?.title ?? "",
    content: task?.content ?? "",
    deadline: task?.deadline ?? "",
    postingDate: task?.posting_date ?? "",
    assigneeId: task?.assigned_to ? String(task.assigned_to.id) : "",
    typeId: task ? String(task.content_type.id) : defaultTypeId(typeOptions),
  }));

  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [typeId, setTypeId] = useState(initial.typeId);
  const [deadline, setDeadline] = useState(initial.deadline);
  const [postingDate, setPostingDate] = useState(initial.postingDate);
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId);

  const [titleError, setTitleError] = useState<string>();
  const [contentError, setContentError] = useState<string>();
  const [typeError, setTypeError] = useState<string>();
  const [deadlineError, setDeadlineError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [savedCount, setSavedCount] = useState(0);
  // Bumped after every save so the cursor returns to Title
  const [focusTitleTick, setFocusTitleTick] = useState(0);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  useEffect(() => {
    if (focusTitleTick > 0) {
      document.getElementById(titleFieldId)?.focus();
    }
  }, [focusTitleTick, titleFieldId]);

  // The card's own type stays selectable even if the plan no longer has it
  const planIds = new Set(typeOptions.map((option) => option.id));
  const allOptions =
    task && !planIds.has(task.content_type.id)
      ? [
          ...typeOptions,
          { id: task.content_type.id, name: task.content_type.name, toWrite: 0 },
        ]
      : typeOptions;

  const isDirty = isEdit
    ? cleanTitle(title) !== cleanTitle(initial.title) ||
      content.trim() !== initial.content.trim() ||
      typeId !== initial.typeId ||
      deadline !== initial.deadline ||
      postingDate !== initial.postingDate ||
      assigneeId !== initial.assigneeId
    : Boolean(
        cleanTitle(title) || content.trim() || deadline || postingDate || assigneeId,
      );

  // Closing a form with unsaved input asks first; closing during a save is blocked
  function requestClose() {
    if (isSaving) {
      return;
    }

    if (isDirty) {
      setIsConfirmingDiscard(true);
      return;
    }

    onClose();
  }

  function clearFieldErrors() {
    setTitleError(undefined);
    setContentError(undefined);
    setTypeError(undefined);
    setDeadlineError(undefined);
    setFormError(undefined);
  }

  // The card was saved: a blank form, same content type, cursor in Title
  function handleCreated() {
    setSavedCount((count) => count + 1);
    setTitle("");
    setContent("");
    setDeadline("");
    setPostingDate("");
    setAssigneeId("");
    clearFieldErrors();
    setFocusTitleTick((tick) => tick + 1);
  }

  function handleSaveError(error: Error) {
    setFormError(getErrorMessage(error));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const cleanedTitle = cleanTitle(title);
    const trimmedContent = content.trim();

    const nextTitleError = !cleanedTitle
      ? "Enter a title for the card."
      : cleanedTitle.length > MAX_TITLE_LENGTH
        ? `Use ${MAX_TITLE_LENGTH} characters or fewer.`
        : undefined;
    const nextContentError =
      trimmedContent.length > MAX_CONTENT_LENGTH
        ? `Use ${MAX_CONTENT_LENGTH} characters or fewer.`
        : undefined;
    const nextTypeError = typeId ? undefined : "Choose a content type.";
    const nextDeadlineError =
      deadline && postingDate && deadline > postingDate
        ? "The deadline can't be after the posting date."
        : undefined;

    setTitleError(nextTitleError);
    setContentError(nextContentError);
    setTypeError(nextTypeError);
    setDeadlineError(nextDeadlineError);

    if (nextTitleError || nextContentError || nextTypeError || nextDeadlineError) {
      setFormError("Fix the highlighted fields and try again.");
      return;
    }

    setFormError(undefined);

    if (!task) {
      createTask.mutate(
        {
          client_id: client.id,
          content_type_id: Number(typeId),
          month,
          title: cleanedTitle,
          content: trimmedContent,
          posting_date: postingDate || null,
          deadline: deadline || null,
          assigned_to: canAssign && assigneeId ? Number(assigneeId) : undefined,
        },
        { onSuccess: handleCreated, onError: handleSaveError },
      );
      return;
    }

    // Send only what changed
    const changes: TaskUpdateRequest = {};

    if (cleanedTitle !== task.title) {
      changes.title = cleanedTitle;
    }

    if (trimmedContent !== task.content) {
      changes.content = trimmedContent;
    }

    if (Number(typeId) !== task.content_type.id) {
      changes.content_type_id = Number(typeId);
    }

    if ((deadline || null) !== task.deadline) {
      changes.deadline = deadline || null;
    }

    if ((postingDate || null) !== task.posting_date) {
      changes.posting_date = postingDate || null;
    }

    if (canAssign && assigneeId !== initial.assigneeId) {
      changes.assigned_to = assigneeId ? Number(assigneeId) : null;
    }

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    updateTask.mutate(
      { id: task.id, data: changes },
      { onSuccess: onClose, onError: handleSaveError },
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        title={isEdit ? "Edit card" : "Add card"}
        description={`${client.name}, ${formatMonth(month)}`}
        className="max-w-xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-3">
            {formError ? (
              <p role="alert" className="mr-auto text-sm text-destructive">
                {formError}
              </p>
            ) : (
              <p role="status" className="mr-auto text-sm text-success">
                {savedCount > 0 &&
                  `${savedCount} ${savedCount === 1 ? "card" : "cards"} saved`}
              </p>
            )}
            <Button variant="ghost" disabled={isSaving} onClick={requestClose}>
              {isEdit ? "Cancel" : "Done"}
            </Button>
            <Button type="submit" form={formId} loading={isSaving}>
              {isEdit ? "Save changes" : "Save card"}
            </Button>
          </div>
        }
      >
        <form
          id={formId}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          {/* The visible Save button sits outside this form (in the dialog
              footer). This invisible one makes Enter submit from any field,
              in every browser. */}
          <button
            type="submit"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />

          <Input
            id={titleFieldId}
            label="Title"
            autoComplete="off"
            data-autofocus
            value={title}
            error={titleError}
            disabled={isSaving}
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleError(undefined);
            }}
          />

          <Textarea
            label="Content"
            rows={6}
            value={content}
            error={contentError}
            disabled={isSaving}
            onChange={(event) => {
              setContent(event.target.value);
              setContentError(undefined);
            }}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Content type"
              value={typeId}
              error={typeError}
              disabled={isSaving}
              onChange={(event) => {
                setTypeId(event.target.value);
                setTypeError(undefined);
              }}
            >
              {allOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {typeLabel(option, planIds.has(option.id))}
                </option>
              ))}
            </Select>

            {canAssign && (
              <div className="space-y-1.5">
                <Select
                  label="Assign to"
                  value={assigneeId}
                  disabled={isSaving || usersQuery.isPending || usersQuery.isError}
                  onChange={(event) => setAssigneeId(event.target.value)}
                >
                  {usersQuery.isPending ? (
                    <option value="">Loading designers…</option>
                  ) : (
                    <>
                      <option value="">Not assigned yet</option>
                      {/* Keep the current designer selectable even if they left the list */}
                      {task?.assigned_to &&
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
                {usersQuery.isError && (
                  <p className="text-sm text-destructive">
                    Couldn't load designers.{" "}
                    <button
                      type="button"
                      onClick={() => usersQuery.refetch()}
                      className="underline underline-offset-2"
                    >
                      Try again
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Deadline (optional)"
              type="date"
              value={deadline}
              error={deadlineError}
              disabled={isSaving}
              onChange={(event) => {
                setDeadline(event.target.value);
                setDeadlineError(undefined);
              }}
            />
            <Input
              label="Posting date (optional)"
              type="date"
              value={postingDate}
              disabled={isSaving}
              onChange={(event) => {
                setPostingDate(event.target.value);
                setDeadlineError(undefined);
              }}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={isConfirmingDiscard}
        title="Discard this card?"
        description="What you entered won't be saved."
        confirmLabel="Discard"
        onConfirm={onClose}
        onCancel={() => setIsConfirmingDiscard(false)}
      />
    </>
  );
}
