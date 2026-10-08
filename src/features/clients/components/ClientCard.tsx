import { Archive, ArchiveRestore, Pencil } from "lucide-react";
import { Link, type To } from "react-router";

import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { IconButton } from "../../../components/ui/IconButton";

import type { Client } from "../types/clientTypes";

interface ClientCardProps {
  client: Client;
  // Where the card leads: the client's month in the calendar for people who
  // write cards, the client's cards on the board for everyone else
  href: To;
  // Whether the signed-in user may archive or restore clients
  canManage: boolean;
  // True while a request for this client is in flight
  busy: boolean;
  onEdit: (client: Client) => void;
  onArchive: (client: Client) => void;
  onRestore: (client: Client) => void;
}

export function ClientCard({
  client,
  href,
  canManage,
  busy,
  onEdit,
  onArchive,
  onRestore,
}: ClientCardProps) {
  return (
    <GlassCard className="relative flex h-full items-start gap-4 p-5 transition hover:bg-white/10">
      <Avatar name={client.name} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-medium">
            {/* The link covers the whole card (the ::after), and the edit and
                archive buttons sit above it */}
            <Link
              to={href}
              className="rounded after:absolute after:inset-0 after:rounded-3xl hover:underline"
            >
              {client.name}
            </Link>
          </h2>
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
        <div className="relative z-10 flex shrink-0 gap-1">
          {/* Archived clients are restored first, then edited */}
          {!client.is_archived && (
            <IconButton
              size={9}
              label={`Edit ${client.name}`}
              title="Edit"
              disabled={busy}
              onClick={() => onEdit(client)}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </IconButton>
          )}
          {client.is_archived ? (
            <IconButton
              size={9}
              label={`Restore ${client.name}`}
              title="Restore"
              disabled={busy}
              onClick={() => onRestore(client)}
            >
              <ArchiveRestore className="size-4" aria-hidden="true" />
            </IconButton>
          ) : (
            <IconButton
              size={9}
              label={`Archive ${client.name}`}
              title="Archive"
              disabled={busy}
              onClick={() => onArchive(client)}
            >
              <Archive className="size-4" aria-hidden="true" />
            </IconButton>
          )}
        </div>
      )}
    </GlassCard>
  );
}
