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

  const warning =
    unfinished > 0
      ? ` They still have ${unfinished} unfinished ${unfinished === 1 ? "card" : "cards"}: ${unfinished === 1 ? "it stays" : "they stay"} assigned until you give ${unfinished === 1 ? "it" : "them"} to someone else.`
      : "";

  return (
    <ConfirmDialog
      open={user !== null}
      title={`Deactivate ${user?.name ?? "this person"}?`}
      description={`They won't be able to sign in. Their account and history are kept, and you can reactivate them anytime.${warning}`}
      confirmLabel="Deactivate"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
