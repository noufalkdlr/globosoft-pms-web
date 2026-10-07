import { Archive, ArchiveRestore, Pencil } from "lucide-react";

import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";

import type { Client } from "../types/clientTypes";

interface ClientCardProps {
  client: Client;
  // Whether the signed-in user may archive or restore clients
  canManage: boolean;
  // True while a request for this client is in flight
  busy: boolean;
  onEdit: (client: Client) => void;
  onArchive: (client: Client) => void;
  onRestore: (client: Client) => void;
}

const ICON_BUTTON_CLASS =
  "grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

export function ClientCard({
  client,
  canManage,
  busy,
  onEdit,
  onArchive,
  onRestore,
}: ClientCardProps) {
  return (
    <GlassCard className="flex h-full items-start gap-4 p-5">
      <Avatar name={client.name} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-medium">{client.name}</h2>
          {client.is_archived && <Badge>Archived</Badge>}
        </div>

        {client.notes && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {client.notes}
          </p>
        )}

        <div className="mt-3">
          {client.current_plan.length > 0 ? (
            <ul
              aria-label={`Monthly plan for ${client.name}`}
              className="flex flex-wrap gap-2"
            >
              {client.current_plan.map((item) => (
                <li key={item.content_type.id}>
                  <Badge>
                    {item.content_type.name}
                    <span className="ml-1.5 text-foreground">{item.count}</span>
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No monthly plan yet</p>
          )}
        </div>
      </div>

      {canManage && (
        <div className="flex shrink-0 gap-1">
          {/* Archived clients are restored first, then edited */}
          {!client.is_archived && (
            <button
              type="button"
              aria-label={`Edit ${client.name}`}
              title="Edit"
              disabled={busy}
              onClick={() => onEdit(client)}
              className={ICON_BUTTON_CLASS}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
          )}
          {client.is_archived ? (
            <button
              type="button"
              aria-label={`Restore ${client.name}`}
              title="Restore"
              disabled={busy}
              onClick={() => onRestore(client)}
              className={ICON_BUTTON_CLASS}
            >
              <ArchiveRestore className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              aria-label={`Archive ${client.name}`}
              title="Archive"
              disabled={busy}
              onClick={() => onArchive(client)}
              className={ICON_BUTTON_CLASS}
            >
              <Archive className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
}
