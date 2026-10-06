import { useId, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { PillTabs } from "../../../components/ui/PillTabs";
import { SearchInput } from "../../../components/ui/SearchInput";
import { useCan } from "../../../hooks/useCan";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { getErrorMessage } from "../../../lib/api/errors";
import { cn } from "../../../utils/cn";
import { toast } from "../../../stores/toastStore";
import { useClients } from "../hooks/useClients";
import { useUpdateClient } from "../hooks/useUpdateClient";
import { ClientCard } from "./ClientCard";
import { ClientFormDialog } from "./ClientFormDialog";

import type { Client } from "../types/clientTypes";

type ClientTab = "active" | "archived";

const TABS: Array<{ value: ClientTab; label: string }> = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

// The API returns at most this many per request. Beyond it, searching narrows the list.
const PAGE_LIMIT = 100;

function ClientListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading clients"
      className="grid gap-3 lg:grid-cols-2"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <GlassCard key={index} className="flex animate-pulse gap-4 p-5">
          <div className="size-10 shrink-0 rounded-full bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-1/3 rounded bg-white/10" />
            <div className="h-3 w-2/3 rounded bg-white/10" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-white/10" />
              <div className="h-5 w-14 rounded-full bg-white/10" />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

export function ClientsContent() {
  const canManage = useCan("can_manage_clients");

  const tabsId = useId();
  const [tab, setTab] = useState<ClientTab>("active");
  const [search, setSearch] = useState("");
  const [clientToArchive, setClientToArchive] = useState<Client | null>(null);
  // "new" = the add form is open, a client = editing it, null = closed
  const [formTarget, setFormTarget] = useState<Client | "new" | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300).trim();
  const isArchivedTab = tab === "archived";

  const clientsQuery = useClients({
    search: debouncedSearch || undefined,
    is_archived: isArchivedTab,
    limit: PAGE_LIMIT,
  });
  const updateClient = useUpdateClient();

  // Which client has a request in flight, so only that row is disabled
  const busyClientId = updateClient.isPending
    ? updateClient.variables?.id
    : undefined;

  function handleConfirmArchive() {
    if (!clientToArchive) {
      return;
    }

    updateClient.mutate(
      { id: clientToArchive.id, data: { is_archived: true } },
      {
        onSuccess: () => setClientToArchive(null),
        // The dialog stays open so the user can retry
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function handleRestore(client: Client) {
    updateClient.mutate(
      { id: client.id, data: { is_archived: false } },
      { onError: (error) => toast.error(getErrorMessage(error)) },
    );
  }

  const data = clientsQuery.data;
  const clients = data?.items ?? [];

  function renderList() {
    if (clientsQuery.isPending) {
      return <ClientListSkeleton />;
    }

    if (clientsQuery.isError) {
      return (
        <MessageCard
          title="Couldn't load clients"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: () => clientsQuery.refetch() }}
        />
      );
    }

    if (clients.length === 0) {
      if (debouncedSearch) {
        return (
          <MessageCard
            title={`No clients match "${debouncedSearch}"`}
            description="Check the spelling or try a shorter name."
            action={{ label: "Show all clients", onClick: () => setSearch("") }}
          />
        );
      }

      return isArchivedTab ? (
        <MessageCard
          title="No archived clients"
          description="Clients you archive show up here and can be restored."
        />
      ) : (
        <MessageCard
          title="No clients yet"
          description={
            canManage
              ? "Add your first client to plan its monthly content."
              : "Clients appear here once Marketing adds them."
          }
          action={
            canManage
              ? { label: "Add client", onClick: () => setFormTarget("new") }
              : undefined
          }
        />
      );
    }

    return (
      <ul className="grid gap-3 lg:grid-cols-2">
        {clients.map((client) => (
          <li key={client.id}>
            <ClientCard
              client={client}
              canManage={canManage}
              busy={busyClientId === client.id}
              onEdit={setFormTarget}
              onArchive={setClientToArchive}
              onRestore={handleRestore}
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
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? "Manage your clients and their monthly plans."
              : "You can view clients. Marketing adds and edits them."}
          </p>
        </div>

        {canManage && (
          <Button className="shrink-0 gap-2" onClick={() => setFormTarget("new")}>
            <Plus className="size-4" aria-hidden="true" />
            Add client
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          label="Search clients"
          placeholder="Search clients"
          value={search}
          onChange={setSearch}
          className="sm:w-80"
        />

        <PillTabs
          tabs={TABS}
          value={tab}
          onChange={setTab}
          label="Client status"
          idPrefix={tabsId}
        />
      </div>

      {data && (
        <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
          {data.total} {tab} {data.total === 1 ? "client" : "clients"}
          {data.total > data.items.length &&
            `. Showing the first ${data.items.length}, search to narrow the list`}
        </p>
      )}

      <div
        id={`${tabsId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-tab-${tab}`}
        className={cn(
          "mt-4 transition-opacity",
          clientsQuery.isPlaceholderData && "opacity-60",
        )}
      >
        {renderList()}
      </div>

      {formTarget !== null && (
        <ClientFormDialog
          client={formTarget === "new" ? null : formTarget}
          onClose={() => setFormTarget(null)}
        />
      )}

      <ConfirmDialog
        open={clientToArchive !== null}
        title={`Archive ${clientToArchive?.name ?? "client"}?`}
        description="It won't show up when planning new months. Its cards, plans and reports stay, and you can restore it anytime."
        confirmLabel="Archive"
        loading={updateClient.isPending}
        onConfirm={handleConfirmArchive}
        onCancel={() => setClientToArchive(null)}
      />
    </div>
  );
}
