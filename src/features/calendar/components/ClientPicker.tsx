import { Select } from "../../../components/ui/Select";

import type { ClientMonthOverview } from "../types/overviewTypes";

const OVERVIEW_VALUE = "overview";

interface ClientPickerProps {
  rows: ClientMonthOverview[] | undefined;
  selectedClientId: number | null;
  onSelect: (clientId: number | null) => void;
}

// Small-screen version of the client list: a dropdown
export function ClientPicker({
  rows,
  selectedClientId,
  onSelect,
}: ClientPickerProps) {
  const clients = rows ?? [];
  const hasSelected = clients.some((row) => row.client.id === selectedClientId);

  return (
    <Select
      label="Client"
      value={hasSelected ? String(selectedClientId) : OVERVIEW_VALUE}
      onChange={(event) =>
        onSelect(
          event.target.value === OVERVIEW_VALUE
            ? null
            : Number(event.target.value),
        )
      }
    >
      <option value={OVERVIEW_VALUE}>Overview</option>
      {clients.map((row) => (
        <option key={row.client.id} value={row.client.id}>
          {row.client.name} (
          {row.totals.target > 0
            ? `${row.totals.written}/${row.totals.target}`
            : row.totals.written}
          )
        </option>
      ))}
    </Select>
  );
}
