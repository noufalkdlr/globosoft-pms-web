import { GlassCard } from "../../../components/ui/GlassCard";
import { Button } from "../../../components/ui/Button";
import { useAuthStore } from "../../../stores/authStore";
import { useLogout } from "../hooks/useLogout";

// TEMPORARY: shows who is logged in plus a logout button, so role-based
// landing pages can be tested. Will move into the app shell / sidebar later.
export function UserCard() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  if (!user) {
    return null;
  }

  const permissions = [
    user.team?.can_create_content && "create content",
    user.team?.can_assign && "assign",
    user.team?.can_review && "review",
  ].filter(Boolean);

  return (
    <GlassCard className="space-y-4">
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Role</dt>
          <dd className="capitalize">{user.role}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Team</dt>
          <dd>{user.team?.name ?? "None"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Permissions</dt>
          <dd>{permissions.length > 0 ? permissions.join(", ") : "None"}</dd>
        </div>
      </dl>

      <Button
        variant="glass"
        fullWidth
        loading={logoutMutation.isPending}
        onClick={() => logoutMutation.mutate()}
      >
        Log out
      </Button>
    </GlassCard>
  );
}
