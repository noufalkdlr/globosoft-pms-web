import { useId, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { PillTabs } from "../../../components/ui/PillTabs";
import { SearchInput } from "../../../components/ui/SearchInput";
import { Select } from "../../../components/ui/Select";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { getErrorMessage } from "../../../lib/api/errors";
import { toast } from "../../../stores/toastStore";
import { useAuthStore } from "../../../stores/authStore";
import { cn } from "../../../utils/cn";
import { useTeams } from "../../teams/hooks/useTeams";
import { useUpdateUser } from "../hooks/useUpdateUser";
import { useUsers } from "../hooks/useUsers";
import { DeactivateDialog } from "./DeactivateDialog";
import { UserFormDialog } from "./UserFormDialog";
import { UserRow } from "./UserRow";

import type { UserRole } from "../../auth/types/authTypes";
import type { UserRecord } from "../types/userTypes";

type UserTab = "active" | "inactive";

const TABS: Array<{ value: UserTab; label: string }> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// The API returns at most this many per request. Beyond it, searching narrows the list.
const PAGE_LIMIT = 100;

function UserListSkeleton() {
  return (
    <div role="status" aria-label="Loading users" className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <GlassCard key={index} className="flex animate-pulse items-center gap-4 p-4">
          <div className="size-10 shrink-0 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2.5">
            <div className="h-4 w-1/3 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/10" />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

export function UsersContent() {
  const currentUser = useAuthStore((state) => state.user);

  const tabsId = useId();
  const [tab, setTab] = useState<UserTab>("active");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "all">("all");
  const [teamId, setTeamId] = useState("all");
  // "new" = the add form is open, a person = editing them, null = closed
  const [formTarget, setFormTarget] = useState<UserRecord | "new" | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<UserRecord | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300).trim();
  const isInactiveTab = tab === "inactive";

  const teamsQuery = useTeams();
  const usersQuery = useUsers({
    search: debouncedSearch || undefined,
    role: role === "all" ? undefined : role,
    team_id: teamId === "all" ? undefined : Number(teamId),
    is_active: !isInactiveTab,
    limit: PAGE_LIMIT,
  });
  const updateUser = useUpdateUser();

  // Which person has a request in flight, so only that row is disabled
  const busyUserId = updateUser.isPending ? updateUser.variables?.id : undefined;
  const hasFilters = Boolean(debouncedSearch) || role !== "all" || teamId !== "all";

  function clearFilters() {
    setSearch("");
    setRole("all");
    setTeamId("all");
  }

  function handleConfirmDeactivate() {
    if (!userToDeactivate) {
      return;
    }

    updateUser.mutate(
      { id: userToDeactivate.id, data: { is_active: false } },
      {
        onSuccess: () => setUserToDeactivate(null),
        // The dialog stays open so the admin can retry
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function handleReactivate(user: UserRecord) {
    updateUser.mutate(
      { id: user.id, data: { is_active: true } },
      { onError: (error) => toast.error(getErrorMessage(error)) },
    );
  }

  const data = usersQuery.data;
  const users = data?.items ?? [];

  function renderList() {
    if (usersQuery.isPending) {
      return <UserListSkeleton />;
    }

    if (usersQuery.isError) {
      return (
        <MessageCard
          title="Couldn't load users"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: () => usersQuery.refetch() }}
        />
      );
    }

    if (users.length === 0) {
      if (hasFilters) {
        return (
          <MessageCard
            title="No one matches"
            description="Check the spelling, or relax the filters."
            action={{ label: "Clear filters", onClick: clearFilters }}
          />
        );
      }

      return isInactiveTab ? (
        <MessageCard
          title="No inactive users"
          description="People you deactivate show up here and can be reactivated."
        />
      ) : (
        <MessageCard
          title="No users yet"
          description="Add the people who will use the app."
          action={{ label: "Add user", onClick: () => setFormTarget("new") }}
        />
      );
    }

    return (
      <ul className="space-y-3">
        {users.map((user) => (
          <li key={user.id}>
            <UserRow
              user={user}
              isYou={user.id === currentUser?.id}
              busy={busyUserId === user.id}
              onEdit={setFormTarget}
              onDeactivate={setUserToDeactivate}
              onReactivate={handleReactivate}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the people who can sign in, and choose their team and role.
          </p>
        </div>

        <Button className="shrink-0 gap-2" onClick={() => setFormTarget("new")}>
          <Plus className="size-4" aria-hidden="true" />
          Add user
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem] sm:items-end">
        <SearchInput
          label="Search users"
          placeholder="Search by name or email"
          value={search}
          onChange={setSearch}
        />

        <Select
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole | "all")}
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </Select>

        <Select
          label="Team"
          value={teamId}
          onChange={(event) => setTeamId(event.target.value)}
        >
          <option value="all">All teams</option>
          {(teamsQuery.data ?? []).map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          tabs={TABS}
          value={tab}
          onChange={setTab}
          label="User status"
          idPrefix={tabsId}
        />

        {data && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {data.total} {tab} {data.total === 1 ? "user" : "users"}
            {data.total > data.items.length &&
              `. Showing the first ${data.items.length}, search to narrow the list`}
          </p>
        )}
      </div>

      <div
        id={`${tabsId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-tab-${tab}`}
        className={cn(
          "mt-4 transition-opacity",
          usersQuery.isPlaceholderData && "opacity-60",
        )}
      >
        {renderList()}
      </div>

      {formTarget !== null && (
        <UserFormDialog
          user={formTarget === "new" ? null : formTarget}
          isYou={formTarget !== "new" && formTarget.id === currentUser?.id}
          onClose={() => setFormTarget(null)}
        />
      )}

      <DeactivateDialog
        user={userToDeactivate}
        loading={updateUser.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setUserToDeactivate(null)}
      />
    </div>
  );
}
