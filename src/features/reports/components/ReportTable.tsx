import { useId, type ReactNode } from "react";

import { GlassCard } from "../../../components/ui/GlassCard";
import { cn } from "../../../utils/cn";

export interface ReportColumn<T> {
  key: string;
  header: string;
  // Numbers line up on the right
  numeric?: boolean;
  render: (row: T) => ReactNode;
}

interface ReportTableProps<T> {
  title: string;
  rows: T[];
  rowKey: (row: T) => string | number;
  // The first column is the row's name (a client, a designer)
  columns: Array<ReportColumn<T>>;
  emptyText: string;
}

// A plain table: the exact numbers behind the charts, readable by screen readers
export function ReportTable<T>({
  title,
  rows,
  rowKey,
  columns,
  emptyText,
}: ReportTableProps<T>) {
  const headingId = useId();

  return (
    <GlassCard role="region" aria-labelledby={headingId} className="p-5">
      <h2 id={headingId} className="text-sm font-medium">
        {title}
      </h2>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-2 py-2 font-normal",
                      column.numeric && "text-right",
                      index === 0 && "pl-0",
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={rowKey(row)} className="border-b border-border/50 last:border-0">
                  {columns.map((column, index) =>
                    index === 0 ? (
                      <th key={column.key} scope="row" className="py-2.5 pr-2 text-left font-medium">
                        {column.render(row)}
                      </th>
                    ) : (
                      <td
                        key={column.key}
                        className={cn("px-2 py-2.5", column.numeric && "text-right tabular-nums")}
                      >
                        {column.render(row)}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
