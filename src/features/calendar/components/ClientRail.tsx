import { Link } from "react-router";
import { LayoutList } from "lucide-react";

import { SearchInput } from "../../../components/ui/SearchInput";
import { cn } from "../../../utils/cn";
import { calendarLink } from "../lib/calendarLink";
import {
  PROGRESS_DOT_CLASS,
  PROGRESS_LABEL,
  getProgressState,
} from "../lib/progress";

import type { ClientMonthOverview } from "../types/overviewTypes";

const ITEM_CLASS =
  "flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition";
const ACTIVE_CLASS = "bg-brand/15 text-foreground ring-1 ring-brand/30";
const IDLE_CLASS = "text-muted-foreground hover:bg-white/5 hover:text-foreground";

interface ClientRailProps {
  rows: ClientMonthOverview[] | undefined;
  month: string;
  selectedClientId: number | null;
  search: string;
  onSearchChange: (value: string) => void;
}

// Desktop client list: Overview first, then every client with how many cards
// are written and a colored dot (red not started, yellow in progress,
// green complete)
export function ClientRail({
  rows,
  month,
  selectedClientId,
  search,
  onSearchChange,
}: ClientRailProps) {
  const needle = search.trim().toLowerCase();
  const visibleRows = (rows ?? []).filter(
    (row) => !needle || row.client.name.toLowerCase().includes(needle),
  );

  return (
    <nav aria-label="Clients" className="space-y-3 lg:sticky lg:top-20 lg:self-start">
      <SearchInput
        label="Search clients"
        placeholder="Search clients"
        value={search}
        onChange={onSearchChange}
      />

      <ul className="max-h-[calc(100dvh-14rem)] space-y-1 overflow-y-auto">
        <li>
          <Link
            to={calendarLink(month)}
            aria-current={selectedClientId === null ? "true" : undefined}
            className={cn(ITEM_CLASS, selectedClientId === null ? ACTIVE_CLASS : IDLE_CLASS)}
          >
            <span className="flex items-center gap-2.5">
              <LayoutList className="size-4" aria-hidden="true" />
              Overview
            </span>
          </Link>
        </li>

        {rows === undefined &&
          Array.from({ length: 5 }, (_, index) => (
            <li key={index} aria-hidden="true">
              <div className="h-10 animate-pulse rounded-2xl bg-white/5" />
            </li>
          ))}

        {visibleRows.map((row) => {
          const { totals } = row;
          const state = getProgressState(totals.written, totals.target);
          const isSelected = row.client.id === selectedClientId;

          return (
            <li key={row.client.id}>
              <Link
                to={calendarLink(month, row.client.id)}
                aria-current={isSelected ? "true" : undefined}
                className={cn(ITEM_CLASS, isSelected ? ACTIVE_CLASS : IDLE_CLASS)}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn("size-2 shrink-0 rounded-full", PROGRESS_DOT_CLASS[state])}
                  />
                  <span className="sr-only">{PROGRESS_LABEL[state]}: </span>
                  <span className="truncate">{row.client.name}</span>
                  {row.client.is_archived && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      Archived
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {totals.target > 0
                    ? `${totals.written}/${totals.target}`
                    : totals.written}
                </span>
              </Link>
            </li>
          );
        })}

        {rows !== undefined && visibleRows.length === 0 && (
          <li className="px-3.5 py-2 text-sm text-muted-foreground">
            No clients match your search.
          </li>
        )}
      </ul>
    </nav>
  );
}
