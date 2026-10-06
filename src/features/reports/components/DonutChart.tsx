import { useId } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { GlassCard } from "../../../components/ui/GlassCard";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  slices: DonutSlice[];
  // Shown instead of the chart when every slice is zero
  emptyText: string;
}

// A donut with its numbers written out next to it. The drawing is for a quick
// look; the list beside it is what screen readers get, and it carries the
// exact numbers.
export function DonutChart({ title, slices, emptyText }: DonutChartProps) {
  const headingId = useId();
  const visible = slices.filter((slice) => slice.value > 0);
  const total = visible.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <GlassCard role="region" aria-labelledby={headingId} className="p-5">
      <h2 id={headingId} className="text-sm font-medium">
        {title}
      </h2>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-3 flex flex-col items-center gap-5 sm:flex-row">
          <div className="relative h-48 w-48 shrink-0" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visible}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="none"
                >
                  {visible.map((slice) => (
                    <Cell key={slice.key} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(28,28,30,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 12,
                  }}
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-2xl font-semibold tabular-nums">{total}</p>
                <p className="text-xs text-muted-foreground">total</p>
              </div>
            </div>
          </div>

          <ul className="w-full space-y-1.5 text-sm">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full"
                    style={{ background: slice.color }}
                  />
                  {slice.label}
                </span>
                <span className="tabular-nums text-muted-foreground">{slice.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}
