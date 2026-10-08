import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { GlassCard } from "../../../components/ui/GlassCard";

import type { UserRecord } from "../types/userTypes";

interface UserRowProps {
  user: UserRecord;
  // True for the signed-in admin: they cannot deactivate themselves
  isYou: boolean;
  // True while a request for this person is in flight
  busy: boolean;
  onEdit: (user: UserRecord) => void;
  onDeactivate: (user: UserRecord) => void;
  onReactivate: (user: UserRecord) => void;
}

export function UserRow({
  user,
  isYou,
  busy,
  onEdit,
  onDeactivate,
  onReactivate,
}: UserRowProps) {
  return (
    <GlassCard className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
      <Avatar name={user.name} src={user.avatar_url} />

      <div className="min-w-0 flex-1 basis-48">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          <span className="truncate">{user.name}</span>
          {isYou && <Badge variant="brand">You</Badge>}
        </p>
        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={user.role === "admin" ? "brand" : "neutral"}>
          {user.role === "admin" ? "Admin" : "Member"}
        </Badge>
        {user.team && <Badge>{user.team.name}</Badge>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-10 px-4 text-sm"
          disabled={busy}
          aria-label={`Edit ${user.name}`}
          onClick={() => onEdit(user)}
        >
          Edit
        </Button>

        {user.is_active ? (
          // Nobody can lock themselves out, so there is no button for yourself
          !isYou && (
            <Button
              variant="ghost"
              className="h-10 px-4 text-sm"
              disabled={busy}
              aria-label={`Deactivate ${user.name}`}
              onClick={() => onDeactivate(user)}
            >
              Deactivate
            </Button>
          )
        ) : (
          <Button
            variant="glass"
            className="h-10 px-4 text-sm"
            loading={busy}
            aria-label={`Reactivate ${user.name}`}
            onClick={() => onReactivate(user)}
          >
            Reactivate
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
