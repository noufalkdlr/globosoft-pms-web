import { useId, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";

import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { getErrorMessage } from "../../../lib/api/errors";
import { addMonths, formatMonth, getCurrentMonth } from "../../../utils/month";
import { useContentTypes } from "../../content-types/hooks/useContentTypes";
import { useCreateClient } from "../hooks/useCreateClient";
import { useUpdateClient } from "../hooks/useUpdateClient";
import {
  createPlanRow,
  planToInputs,
  plansEqual,
  rowsFromPlan,
  toPlanItems,
  validateRows,
  type PlanRowErrors,
  type PlanRowState,
} from "../lib/planRows";
import { PlanEditor } from "./PlanEditor";

import type { Client, ClientUpdateRequest } from "../types/clientTypes";

const MAX_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;

// "Fresh   Bakes " and "Fresh Bakes" are the same name
function cleanName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

interface ClientFormDialogProps {
  // null = adding a new client
  client: Client | null;
  onClose: () => void;
}

// Mount it only while it should be open: it reads its starting values from
// props once, so every open starts from a clean form.
export function ClientFormDialog({ client, onClose }: ClientFormDialogProps) {
  const isEdit = client !== null;
  const formId = useId();

  const contentTypesQuery = useContentTypes();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isSaving = createClient.isPending || updateClient.isPending;

  const [initial] = useState(() => ({
    name: client?.name ?? "",
    notes: client?.notes ?? "",
    items: client ? planToInputs(client.current_plan) : [],
  }));
  const [currentMonth] = useState(() => getCurrentMonth());
  const nextMonth = addMonths(currentMonth, 1);

  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [rows, setRows] = useState<PlanRowState[]>(() =>
    client ? rowsFromPlan(client.current_plan) : [createPlanRow()],
  );
  // Only asked when editing an existing plan. A plan change usually starts
  // next month, so the running month's reports are not rewritten.
  const [effectiveFrom, setEffectiveFrom] = useState(nextMonth);

  const [nameError, setNameError] = useState<string>();
  const [notesError, setNotesError] = useState<string>();
  const [rowErrors, setRowErrors] = useState<Record<string, PlanRowErrors>>({});
  const [formError, setFormError] = useState<string>();
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  const planItems = toPlanItems(rows);
  const planChanged = !plansEqual(planItems, initial.items);
  const isDirty =
    cleanName(name) !== cleanName(initial.name) ||
    notes.trim() !== initial.notes.trim() ||
    planChanged;

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

  function handleSaveError(error: Error) {
    // The only 409 here is "name already taken": show it on the name field
    if (isAxiosError(error) && error.response?.status === 409) {
      setNameError(getErrorMessage(error));
      return;
    }

    setFormError(getErrorMessage(error));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const cleanedName = cleanName(name);
    const trimmedNotes = notes.trim();

    const nextNameError = !cleanedName
      ? "Enter the client's name."
      : cleanedName.length > MAX_NAME_LENGTH
        ? `Use ${MAX_NAME_LENGTH} characters or fewer.`
        : undefined;
    const nextNotesError =
      trimmedNotes.length > MAX_NOTES_LENGTH
        ? `Use ${MAX_NOTES_LENGTH} characters or fewer.`
        : undefined;
    const nextRowErrors = validateRows(rows);

    setNameError(nextNameError);
    setNotesError(nextNotesError);
    setRowErrors(nextRowErrors);

    if (
      nextNameError ||
      nextNotesError ||
      Object.keys(nextRowErrors).length > 0
    ) {
      setFormError("Fix the highlighted fields and try again.");
      return;
    }

    setFormError(undefined);

    const callbacks = { onSuccess: onClose, onError: handleSaveError };

    if (!client) {
      createClient.mutate(
        {
          name: cleanedName,
          notes: trimmedNotes || null,
          plan:
            planItems.length > 0
              ? { effective_from_month: currentMonth, items: planItems }
              : undefined,
        },
        callbacks,
      );
      return;
    }

    // Send only what changed
    const changes: ClientUpdateRequest = {};

    if (cleanedName !== client.name) {
      changes.name = cleanedName;
    }

    if (trimmedNotes !== (client.notes ?? "")) {
      changes.notes = trimmedNotes || null;
    }

    if (planChanged) {
      changes.plan = { effective_from_month: effectiveFrom, items: planItems };
    }

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    updateClient.mutate({ id: client.id, data: changes }, callbacks);
  }

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        title={isEdit ? `Edit ${client.name}` : "Add client"}
        description="Set the monthly content this client needs."
        className="max-w-xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-3">
            {formError && (
              <p role="alert" className="mr-auto text-sm text-destructive">
                {formError}
              </p>
            )}
            <Button variant="ghost" disabled={isSaving} onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" form={formId} loading={isSaving}>
              {isEdit ? "Save changes" : "Add client"}
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
            label="Name"
            autoComplete="off"
            data-autofocus
            value={name}
            error={nameError}
            disabled={isSaving}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(undefined);
            }}
          />

          <Textarea
            label="Notes (optional)"
            rows={3}
            value={notes}
            error={notesError}
            disabled={isSaving}
            onChange={(event) => {
              setNotes(event.target.value);
              setNotesError(undefined);
            }}
          />

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Monthly plan</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                How many of each content type this client needs every month.
              </p>
            </div>

            {contentTypesQuery.isPending ? (
              <p role="status" className="text-sm text-muted-foreground">
                Loading content types…
              </p>
            ) : contentTypesQuery.isError ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-destructive">
                  Couldn't load content types.
                </p>
                <Button
                  variant="ghost"
                  className="h-10 px-3 text-sm"
                  onClick={() => contentTypesQuery.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <PlanEditor
                rows={rows}
                onChange={setRows}
                contentTypes={contentTypesQuery.data}
                errors={rowErrors}
                disabled={isSaving}
              />
            )}

            {isEdit && planChanged && (
              <div className="space-y-2 rounded-2xl border border-border bg-white/5 p-4">
                <Select
                  label="Apply the new plan from"
                  value={effectiveFrom}
                  disabled={isSaving}
                  onChange={(event) => setEffectiveFrom(event.target.value)}
                >
                  <option value={currentMonth}>
                    This month ({formatMonth(currentMonth)})
                  </option>
                  <option value={nextMonth}>
                    Next month ({formatMonth(nextMonth)})
                  </option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Earlier months keep their old plan, so past reports don't
                  change.
                </p>
                {planItems.length === 0 && (
                  <p className="text-xs text-destructive">
                    No content types are left, so this ends the whole plan from
                    that month.
                  </p>
                )}
              </div>
            )}
          </section>
        </form>
      </Modal>

      <ConfirmDialog
        open={isConfirmingDiscard}
        title="Discard changes?"
        description="What you entered won't be saved."
        confirmLabel="Discard"
        onConfirm={onClose}
        onCancel={() => setIsConfirmingDiscard(false)}
      />
    </>
  );
}
