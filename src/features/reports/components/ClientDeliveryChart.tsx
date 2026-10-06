import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GlassCard } from "../../../components/ui/GlassCard";
import { toDeliveryBars } from "../lib/deliveryBars";
import { STATUS_COLORS } from "../lib/reportLabels";

import type { ClientReportRow } from "../types/reportTypes";

// Per client, the month's target split three ways: done, written but not done
// yet, and still to be written. Together they show how far each client is.
const PARTS = [
  { key: "delivered", label: "Delivered", color: STATUS_COLORS.done },
  { key: "in_progress", label: "Written, not done", color: STATUS_COLORS.ongoing },
  { key: "to_write", label: "Still to write", color: "rgba(255,255,255,0.18)" },
] as const;

interface ClientDeliveryChartProps {
  rows: ClientReportRow[];
}

export function ClientDeliveryChart({ rows }: ClientDeliveryChartProps) {
  const headingId = useId();
  const data = toDeliveryBars(rows);

  return (
    <GlassCard role="region" aria-labelledby={headingId} className="p-5">
      <h2 id={headingId} className="text-sm font-medium">
        Delivery by client
      </h2>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No client has a plan for this month.
        </p>
      ) : (
        <>
          <div
            className="mt-3"
            style={{ height: Math.max(180, data.length * 44 + 40) }}
            aria-hidden="true"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#a1a1a6", fontSize: 12 }}
                  stroke="rgba(255,255,255,0.12)"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: "#e5e5ea", fontSize: 12 }}
                  stroke="rgba(255,255,255,0.12)"
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    background: "rgba(28,28,30,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
                {PARTS.map((part) => (
                  <Bar
                    key={part.key}
                    dataKey={part.key}
                    name={part.label}
                    stackId="client"
                    fill={part.color}
                    radius={part.key === "to_write" ? [0, 6, 6, 0] : 0}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
            {PARTS.map((part) => (
              <li key={part.key} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
                  style={{ background: part.color }}
                />
                {part.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </GlassCard>
  );
}
