import { useState } from "react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { getErrorMessage } from "../../../lib/api/errors";
import { toast } from "../../../stores/toastStore";
import { useContentTypes } from "../hooks/useContentTypes";
import { useUpdateContentType } from "../hooks/useUpdateContentType";
import { RenameContentTypeDialog } from "./RenameContentTypeDialog";

import type { ContentType } from "../types/contentTypeTypes";

function ListSkeleton() {
  return (
    <div role="status" aria-label="Loading content types" className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <GlassCard key={index} className="h-16 animate-pulse p-4" />
      ))}
    </div>
  );
}

// Admin page for the kinds of posts a client's plan is made of. Anyone in
// Marketing can add a type while setting up a plan; renaming one, and turning
// one off, is done here. Types are never deleted, so old cards keep theirs.
export function ContentTypesContent() {
  const typesQuery = useContentTypes();
  const updateType = useUpdateContentType();

  const [renameTarget, setRenameTarget] = useState<ContentType | null>(null);
  const [turnOffTarget, setTurnOffTarget] = useState<ContentType | null>(null);

  // Which type has a request in flight, so only its buttons are disabled
  const busyId = updateType.isPending ? updateType.variables?.id : undefined;

  // The ones in use first, then the ones turned off
  const types = [...(typesQuery.data ?? [])].sort(
    (a, b) =>
      Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name),
  );

  function handleTurnOn(type: ContentType) {
    updateType.mutate(
      { id: type.id, data: { is_active: true } },
      { onError: (error) => toast.error(getErrorMessage(error)) },
    );
  }

  function handleConfirmTurnOff() {
    if (!turnOffTarget) {
      return;
    }

    updateType.mutate(
      { id: turnOffTarget.id, data: { is_active: false } },
      {
        onSuccess: () => setTurnOffTarget(null),
        // The dialog stays open so the admin can retry
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function renderList() {
    if (typesQuery.isPending) {
      return <ListSkeleton />;
    }

    if (typesQuery.isError) {
      return (
        <MessageCard
          title="Couldn't load content types"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: () => typesQuery.refetch() }}
        />
      );
    }

    if (types.length === 0) {
      return (
        <MessageCard
          title="No content types yet"
          description="Marketing adds them while setting up a client's monthly plan."
        />
      );
    }

    return (
      <ul className="space-y-3">
        {types.map((type) => (
          <li key={type.id}>
            <GlassCard className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
              <p className="min-w-0 flex-1 basis-40 truncate font-medium">
                {type.name}
              </p>

              <Badge variant={type.is_active ? "success" : "neutral"}>
                {type.is_active ? "In use" : "Turned off"}
              </Badge>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-10 px-4 text-sm"
                  disabled={busyId === type.id}
                  aria-label={`Rename ${type.name}`}
                  onClick={() => setRenameTarget(type)}
                >
                  Rename
                </Button>

                {type.is_active ? (
                  <Button
                    variant="ghost"
                    className="h-10 px-4 text-sm"
                    disabled={busyId === type.id}
                    aria-label={`Turn off ${type.name}`}
                    onClick={() => setTurnOffTarget(type)}
                  >
                    Turn off
                  </Button>
                ) : (
                  <Button
                    variant="glass"
                    className="h-10 px-4 text-sm"
                    loading={busyId === type.id}
                    aria-label={`Turn on ${type.name}`}
                    onClick={() => handleTurnOn(type)}
                  >
                    Turn on
                  </Button>
                )}
              </div>
            </GlassCard>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold">Content types</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The kinds of posts a client's monthly plan is made of. Marketing adds
          new ones while setting up a plan. Renaming and turning off is done here.
        </p>
      </header>

      <div className="mt-6">{renderList()}</div>

      {renameTarget && (
        <RenameContentTypeDialog
          contentType={renameTarget}
          onClose={() => setRenameTarget(null)}
        />
      )}

      <ConfirmDialog
        open={turnOffTarget !== null}
        title={`Turn off ${turnOffTarget?.name ?? "this type"}?`}
        description="It can't be added to a client's plan any more. Cards and plans that already use it keep working, and you can turn it on again anytime."
        confirmLabel="Turn off"
        loading={updateType.isPending}
        onConfirm={handleConfirmTurnOff}
        onCancel={() => setTurnOffTarget(null)}
      />
    </div>
  );
}
