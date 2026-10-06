import { useRef } from "react";

import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { toast } from "../../../stores/toastStore";

interface ReportTextDialogProps {
  text: string;
  onClose: () => void;
}

// The daily report as text, to paste into WhatsApp or an email. Shown in a
// box so it can be read and edited first, with a button that copies it.
// Mount it only while it is open.
export function ReportTextDialog({ text, onClose }: ReportTextDialogProps) {
  const boxRef = useRef<HTMLTextAreaElement>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(boxRef.current?.value ?? text);
      toast.success("Report copied");
    } catch {
      // Some browsers refuse the clipboard: select the text so Ctrl+C works
      boxRef.current?.select();
      toast.error("Couldn't copy automatically. The text is selected, press Ctrl+C.");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Daily report"
      description="Edit it if you like, then copy it."
      className="max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy}>Copy report</Button>
        </>
      }
    >
      <textarea
        ref={boxRef}
        aria-label="Report text"
        defaultValue={text}
        rows={16}
        spellCheck={false}
        data-autofocus
        className="w-full resize-y rounded-xl border border-border bg-white/5 p-3 font-mono text-sm text-foreground outline-none focus:border-brand/60 focus:ring-4 focus:ring-brand/20"
      />
    </Modal>
  );
}
