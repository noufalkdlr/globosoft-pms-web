import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useTasks } from "../../tasks/hooks/useTasks";

import type { UserRecord } from "../types/userTypes";

interface DeactivateDialogProps {
  // The person about to be deactivated, or null while the dialog is closed
  user: UserRecord | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Deactivating keeps the person's account and history but stops them signing
// in. If they still hold unfinished cards, say so: those cards stay assigned
// to them until someone gives them to another designer.
export function DeactivateDialog({
  user,
  loading,
  onConfirm,
  onCancel,
}: DeactivateDialogProps) {
  const cardsQuery = useTasks({ assigned_to: user?.id, limit: 500 }, user !== null);
  const unfinished =
    cardsQuery.data?.items.filter((task) => task.status !== "done").length ?? 0;

  // Never let the admin say yes before they have seen what the person still
  // holds. If the cards cannot be loaded, say so: they may still go ahead.
  const isChecking = user !== null && cardsQuery.isPending;

  let warning = "";

  if (isChecking) {
    warning = " Checking whether they still hold cards…";
  } else if (cardsQuery.isError) {
    warning = " We couldn't check whether they still hold cards.";
  } else if (unfinished > 0) {
    const one = unfinished === 1;
    warning = ` They still have ${unfinished} unfinished ${one ? "card" : "cards"}: ${one ? "it stays" : "they stay"} assigned until you give ${one ? "it" : "them"} to someone else.`;
  }

  return (
    <ConfirmDialog
      open={user !== null}
      title={`Deactivate ${user?.name ?? "this person"}?`}
      description={`They won't be able to sign in. Their account and history are kept, and you can reactivate them anytime.${warning}`}
      confirmLabel="Deactivate"
      loading={loading}
      confirmDisabled={isChecking}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
