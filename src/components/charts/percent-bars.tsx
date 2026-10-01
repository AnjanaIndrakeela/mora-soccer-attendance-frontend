"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useId } from "react";
import { formatPercent } from "@/lib/format";
import { AXIS_TICK, ChartTooltip } from "./chart-tooltip";
import { LinearGradient, svgId } from "./gradients";

export interface PercentBarDatum {
  key: string;
  label: string;
  percent: number | null;
  approved: number;
  total: number;
  /** Draws the bar in the critical status color (e.g. below the at-risk threshold). */
  flagged?: boolean;
}

/**
 * Horizontal bars of attendance % per category. One measure, one hue; values ride the bar tips.
 * Each bar fades in from the axis to full color at its tip.
 * Flagged bars use the status color, and their labels say so, so color is never the only cue.
 */
export function PercentBars({ data, rowHeight = 32 }: { data: PercentBarDatum[]; rowHeight?: number }) {
  const rows = data.map((d) => ({ ...d, value: d.percent ?? 0 }));
  const height = Math.max(120, rows.length * rowHeight + 32);
  const id = svgId(useId());
  const fillId = `${id}-bar`;
  const flaggedId = `${id}-bar-flagged`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }} barCategoryGap={4}>
          <defs>
            <LinearGradient id={fillId} color="var(--series-1)" />
            <LinearGradient id={flaggedId} color="var(--status-critical)" />
          </defs>
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" width={170} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--grid)" }} interval={0} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={({ active, payload }) => {
              const d = active && (payload?.[0]?.payload as (typeof rows)[number] | undefined);
              return d ? (
                <ChartTooltip
                  title={d.label}
                  rows={[
                    { label: "Attendance", value: formatPercent(d.percent), swatch: d.flagged ? "var(--status-critical)" : "var(--series-1)" },
                    { label: "Present", value: `${d.approved} / ${d.total}` },
                    ...(d.flagged ? [{ label: "Status", value: "At risk" }] : []),
                  ]}
                />
              ) : null;
            }}
          />
          <Bar dataKey="value" maxBarSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {rows.map((d) => (
              <Cell key={d.key} fill={`url(#${d.flagged ? flaggedId : fillId})`} />
            ))}
            <LabelList
              dataKey="percent"
              position="right"
              formatter={(v: unknown) => formatPercent(typeof v === "number" ? v : null)}
              style={{ fontSize: 12, fill: "var(--foreground)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
