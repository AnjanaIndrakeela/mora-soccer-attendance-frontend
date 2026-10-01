"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPercent, formatShortDate, formatWeekdayDate, SESSION_TYPE_LABELS } from "@/lib/format";
import type { TrendPoint } from "@/lib/types";
import { AXIS_TICK, ChartTooltip } from "./chart-tooltip";
import { LinearGradient, svgId } from "./gradients";

/** Attendance % over time: one series, so no legend; the card title names it. A gradient wash fades from the line to the baseline. */
export function TrendChart({ data, groupBy = "session", height = 260 }: { data: TrendPoint[]; groupBy?: "session" | "week"; height?: number }) {
  const rows = data.map((d) => ({ ...d, x: d.date, y: d.percent ?? 0 }));
  const fillId = `${svgId(useId())}-area`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <defs>
            <LinearGradient id={fillId} color="var(--series-1)" direction="vertical" from={100} fromOpacity={0} toOpacity={0.35} />
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grid)" strokeWidth={1} />
          <XAxis
            dataKey="x"
            tickFormatter={(v) => formatShortDate(v)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--grid)" }}
            minTickGap={24}
          />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              const d = active && (payload?.[0]?.payload as (typeof rows)[number] | undefined);
              if (!d) return null;
              const title = groupBy === "week" ? `Week of ${formatShortDate(d.date)}` : formatWeekdayDate(d.date);
              return (
                <ChartTooltip
                  title={title}
                  rows={[
                    ...(d.type ? [{ label: "Type", value: SESSION_TYPE_LABELS[d.type] }] : []),
                    { label: "Attendance", value: formatPercent(d.percent), swatch: "var(--series-1)" },
                    { label: "Present", value: `${d.approved} / ${d.total}` },
                  ]}
                />
              );
            }}
          />
          <Area
            type="linear"
            dataKey="y"
            fill={`url(#${fillId})`}
            stroke="var(--series-1)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={rows.length <= 16 ? { r: 4, fill: "var(--series-1)", stroke: "var(--card)", strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: "var(--series-1)", stroke: "var(--card)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
