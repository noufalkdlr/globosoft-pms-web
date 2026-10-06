import {
  useEffect,
  useId,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { getErrorMessage } from "../../../lib/api/errors";
import { toast } from "../../../stores/toastStore";
import { cn } from "../../../utils/cn";
import { useCreateContentType } from "../../content-types/hooks/useCreateContentType";
import {
  MAX_COUNT,
  MAX_PLAN_ROWS,
  createPlanRow,
  type PlanRowErrors,
  type PlanRowState,
} from "../lib/planRows";

import type { ContentType } from "../../content-types/types/contentTypeTypes";

const NEW_TYPE_VALUE = "__new__";

const SMALL_BUTTON_CLASS =
  "rounded-lg px-2.5 py-1 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

type RowField = "type" | "new-type" | "count";

interface PlanEditorProps {
  rows: PlanRowState[];
  // Accepts an updater function, so a slow request that finishes later never
  // overwrites edits the user made in the meantime
  onChange: Dispatch<SetStateAction<PlanRowState[]>>;
  // Every content type, including inactive ones (needed to spot duplicates)
  contentTypes: ContentType[];
  errors: Record<string, PlanRowErrors>;
  disabled?: boolean;
}

export function PlanEditor({
  rows,
  onChange,
  contentTypes,
  errors,
  disabled,
}: PlanEditorProps) {
  const createType = useCreateContentType();
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [newTypeErrors, setNewTypeErrors] = useState<Record<string, string>>(
    {},
  );

  const baseId = useId();
  const addRowButtonId = `${baseId}-add-row`;
  const fieldId = (key: string, field: RowField) =>
    `${baseId}-${key}-${field}`;

  // Rows swap controls in and out (select <-> text field) and rows come and go,
  // which would drop keyboard focus onto the page. An action asks for the next
  // focus target here, and it is applied once the new controls exist.
  const pendingFocusId = useRef<string | null>(null);

  useEffect(() => {
    if (pendingFocusId.current) {
      document.getElementById(pendingFocusId.current)?.focus();
      pendingFocusId.current = null;
    }
  });

  function updateRow(key: string, changes: Partial<PlanRowState>) {
    onChange((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  }

  function setNewTypeError(key: string, message?: string) {
    setNewTypeErrors((current) => {
      const next = { ...current };

      if (message) {
        next[key] = message;
      } else {
        delete next[key];
      }

      return next;
    });
  }

  function addRow() {
    const row = createPlanRow();

    onChange((current) => [...current, row]);
    pendingFocusId.current = fieldId(row.key, "type");
  }

  function removeRow(key: string) {
    onChange((current) => current.filter((row) => row.key !== key));
    setNewTypeError(key);
    pendingFocusId.current = addRowButtonId;
  }

  function handleTypeChange(row: PlanRowState, value: string) {
    if (value === NEW_TYPE_VALUE) {
      updateRow(row.key, { contentTypeId: "", newTypeName: "" });
      pendingFocusId.current = fieldId(row.key, "new-type");
      return;
    }

    updateRow(row.key, { contentTypeId: value });
  }

  function cancelNewType(row: PlanRowState) {
    updateRow(row.key, { newTypeName: null });
    setNewTypeError(row.key);
    pendingFocusId.current = fieldId(row.key, "type");
  }

  function submitNewType(row: PlanRowState) {
    const name = (row.newTypeName ?? "").trim().replace(/\s+/g, " ");

    if (!name) {
      setNewTypeError(row.key, "Enter a name.");
      return;
    }

    // Typing a name that already exists selects it instead of duplicating it
    const existing = contentTypes.find(
      (type) => type.name.toLowerCase() === name.toLowerCase(),
    );

    if (existing) {
      if (!existing.is_active) {
        setNewTypeError(
          row.key,
          `${existing.name} exists but is turned off. Ask an admin to turn it on.`,
        );
        return;
      }

      const usedElsewhere = rows.some(
        (other) =>
          other.key !== row.key && other.contentTypeId === String(existing.id),
      );

      if (usedElsewhere) {
        setNewTypeError(row.key, `${existing.name} is already in this plan.`);
        return;
      }

      updateRow(row.key, {
        contentTypeId: String(existing.id),
        newTypeName: null,
      });
      setNewTypeError(row.key);
      pendingFocusId.current = fieldId(row.key, "count");
      toast.info(`${existing.name} already exists, so it was selected`);
      return;
    }

    setCreatingKey(row.key);
    createType.mutate(
      { name },
      {
        onSuccess: (created) => {
          updateRow(row.key, {
            contentTypeId: String(created.id),
            newTypeName: null,
          });
          setNewTypeError(row.key);
          pendingFocusId.current = fieldId(row.key, "count");
        },
        onError: (error) => setNewTypeError(row.key, getErrorMessage(error)),
        onSettled: () => setCreatingKey(null),
      },
    );
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No monthly plan yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => {
            const position = index + 1;
            const rowErrors = errors[row.key];
            const isCreatingType = row.newTypeName !== null;
            const isSavingType = creatingKey === row.key;

            // A type already chosen in another row is not offered again
            const usedByOtherRows = new Set(
              rows
                .filter((other) => other.key !== row.key && other.contentTypeId)
                .map((other) => other.contentTypeId),
            );
            const options = contentTypes.filter(
              (type) =>
                (type.is_active || String(type.id) === row.contentTypeId) &&
                !usedByOtherRows.has(String(type.id)),
            );

            return (
              <li
                key={row.key}
                className="grid grid-cols-[minmax(0,1fr)_6rem_auto] items-start gap-2"
              >
                {isCreatingType ? (
                  <div className="space-y-1">
                    <Input
                      id={fieldId(row.key, "new-type")}
                      aria-label={`New content type name, row ${position}`}
                      placeholder="New content type"
                      value={row.newTypeName ?? ""}
                      error={newTypeErrors[row.key]}
                      disabled={disabled || isSavingType}
                      onChange={(event) => {
                        updateRow(row.key, { newTypeName: event.target.value });
                        setNewTypeError(row.key);
                      }}
                      onKeyDown={(event) => {
                        // Enter creates the type, it must not submit the whole form
                        if (event.key === "Enter") {
                          event.preventDefault();
                          submitNewType(row);
                        }
                      }}
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label={`Create type, row ${position}`}
                        disabled={disabled || isSavingType}
                        onClick={() => submitNewType(row)}
                        className={SMALL_BUTTON_CLASS}
                      >
                        {isSavingType ? "Creating…" : "Create type"}
                      </button>
                      <button
                        type="button"
                        aria-label={`Cancel new type, row ${position}`}
                        disabled={isSavingType}
                        onClick={() => cancelNewType(row)}
                        className={cn(SMALL_BUTTON_CLASS, "text-muted-foreground")}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <Select
                    id={fieldId(row.key, "type")}
                    aria-label={`Content type, row ${position}`}
                    value={row.contentTypeId}
                    error={rowErrors?.type}
                    disabled={disabled}
                    onChange={(event) =>
                      handleTypeChange(row, event.target.value)
                    }
                  >
                    <option value="">Select type</option>
                    {options.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                    <option value={NEW_TYPE_VALUE}>Add new type…</option>
                  </Select>
                )}

                <Input
                  id={fieldId(row.key, "count")}
                  type="number"
                  inputMode="numeric"
                  aria-label={`Monthly count, row ${position}`}
                  placeholder="Count"
                  min={1}
                  max={MAX_COUNT}
                  step={1}
                  value={row.count}
                  error={rowErrors?.count}
                  disabled={disabled}
                  onChange={(event) =>
                    updateRow(row.key, { count: event.target.value })
                  }
                />

                <button
                  type="button"
                  aria-label={`Remove row ${position}`}
                  disabled={disabled || isSavingType}
                  onClick={() => removeRow(row.key)}
                  className="grid size-12 place-items-center rounded-xl text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        id={addRowButtonId}
        variant="ghost"
        className="h-10 justify-start gap-2 px-3 text-sm"
        disabled={disabled || rows.length >= MAX_PLAN_ROWS}
        onClick={addRow}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add type
      </Button>
    </div>
  );
}
