"use client";

import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { useId } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPercent } from "@/lib/format";
import { ChartTooltip } from "./chart-tooltip";
import { LinearGradient, svgId } from "./gradients";

const SLICES = [
  { key: "APPROVED", label: "Present", color: "var(--attendance-present)", icon: CheckCircle2 },
  { key: "REJECTED", label: "Rejected", color: "var(--attendance-rejected)", icon: XCircle },
  { key: "ABSENT", label: "Absent", color: "var(--attendance-absent)", icon: MinusCircle },
] as const;

type Counts = { APPROVED: number; REJECTED: number; ABSENT: number };

/** Part-to-whole of all attendance records in finalized sessions. The hero number is the attendance rate. */
export function AttendanceDonut({ counts, percent }: { counts: Counts; percent: number | null }) {
  const total = counts.APPROVED + counts.REJECTED + counts.ABSENT;
  const data = SLICES.map((s) => ({ ...s, value: counts[s.key] }));
  const share = (v: number) => (total ? `${Math.round((v / total) * 100)}%` : "—");
  const id = svgId(useId());

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative size-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {SLICES.map((s) => (
                <LinearGradient key={s.key} id={`${id}-${s.key}`} color={s.color} direction="diagonal" from={60} />
              ))}
            </defs>
            <Pie
              data={total ? data : [{ key: "none", value: 1 }]}
              dataKey="value"
              nameKey="label"
              innerRadius="72%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              // 2px surface gap between segments.
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {total ? data.map((d) => <Cell key={d.key} fill={`url(#${id}-${d.key})`} />) : <Cell fill="var(--muted)" />}
            </Pie>
            {total > 0 && (
              <Tooltip
                content={({ active, payload }) => {
                  const d = active && payload?.[0]?.payload;
                  return d ? <ChartTooltip title={d.label} rows={[{ label: "Records", value: `${d.value} (${share(d.value)})`, swatch: d.color }]} /> : null;
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight">{formatPercent(percent)}</span>
          <span className="text-xs text-muted-foreground">attendance</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2 text-sm" aria-label="Attendance breakdown">
        {data.map(({ key, label, color, icon: Icon, value }) => (
          <li key={key} className="flex items-center justify-between gap-4 border-b pb-2 last:border-0">
            <span className="flex items-center gap-2">
              <Icon className="size-4" style={{ color }} />
              {label}
            </span>
            <span className="tabular-nums">
              <span className="font-medium">{value}</span> <span className="text-muted-foreground">· {share(value)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
