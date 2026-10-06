import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, MessageSquareWarning } from "lucide-react";

import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { toast } from "../../../stores/toastStore";
import { copyText } from "../../../utils/clipboard";
import { getTodayIst, formatShortDate } from "../../../utils/date";
import { formatMonth, getCurrentMonth } from "../../../utils/month";
import { isLate, isOverdue, isSafeLink } from "../lib/taskDates";
import { STATUS_LABEL, STATUS_VARIANT } from "../lib/taskStatus";

import type { Task } from "../types/taskTypes";

// How long the tick stays on the copy button
const COPIED_MS = 2000;

interface TaskDetailsDialogProps {
  task: Task;
  onClose: () => void;
}

// Everything about one card, in full: above all the content the writer wrote,
// which the designer needs to do the work, with a button that copies it.
// Mount it only while it is open.
export function TaskDetailsDialog({ task, onClose }: TaskDetailsDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // The tick on the copy button goes away by itself
  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), COPIED_MS);

    return () => clearTimeout(timer);
  }, [copied]);

  const today = getTodayIst();
  const hasContent = task.content.trim().length > 0;
  const overdue = isOverdue(task, today);
  const note =
    task.status === "fix" && task.latest_review?.decision === "rejected"
      ? task.latest_review
      : null;

  async function handleCopy() {
    if (await copyText(task.content)) {
      setCopied(true);
      toast.success("Content copied");
      return;
    }

    // The browser refused: select the text so Ctrl+C works
    if (contentRef.current) {
      const range = document.createRange();
      range.selectNodeContents(contentRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    toast.error("Couldn't copy automatically. The text is selected, press Ctrl+C.");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={task.title}
      description={`${task.client.name}, ${formatMonth(task.month)}`}
      className="max-w-xl"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[task.status]}>{STATUS_LABEL[task.status]}</Badge>
          <Badge>{task.content_type.name}</Badge>
          {isLate(task, getCurrentMonth()) && (
            <Badge variant="danger">Late from {formatMonth(task.month)}</Badge>
          )}
        </div>

        {note && (
          <div className="flex gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <MessageSquareWarning
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-medium">What to fix</p>
              <p className="mt-1 whitespace-pre-wrap break-words">{note.comment}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{note.reviewer.name}</p>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Designer</dt>
            <dd className="mt-0.5">
              {task.assigned_to ? (
                <span className="flex items-center gap-2">
                  <Avatar name={task.assigned_to.name} size="sm" />
                  {task.assigned_to.name}
                </span>
              ) : (
                <Badge variant="danger">Unassigned</Badge>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Deadline</dt>
            <dd className={overdue ? "mt-0.5 text-destructive" : "mt-0.5"}>
              {task.deadline
                ? `${formatShortDate(task.deadline)}${overdue ? " (overdue)" : ""}`
                : "Not set"}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Posting date</dt>
            <dd className="mt-0.5">
              {task.posting_date ? formatShortDate(task.posting_date) : "Not set"}
            </dd>
          </div>

          {isSafeLink(task.file_link) && (
            <div>
              <dt className="text-xs text-muted-foreground">Finished design</dt>
              <dd className="mt-0.5">
                <a
                  href={task.file_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-2"
                >
                  Design
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </dd>
            </div>
          )}
        </dl>

        <section aria-labelledby={`content-${task.id}`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 id={`content-${task.id}`} className="text-sm font-medium">
              Content
            </h3>

            {hasContent && (
              <button
                type="button"
                aria-label={copied ? "Content copied" : "Copy content"}
                title="Copy to clipboard"
                onClick={handleCopy}
                className="grid size-9 place-items-center rounded-full border border-border bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                {copied ? (
                  <Check className="size-4 text-success" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>

          {hasContent ? (
            // Line breaks the writer typed are kept
            <div
              ref={contentRef}
              className="max-h-[45vh] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-white/5 p-4 text-sm"
            >
              {task.content}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm italic text-muted-foreground">
              No content has been written for this card yet.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
