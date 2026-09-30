/** Shared tooltip surface for Recharts custom `content` renderers. Text uses text tokens, never series colors. */
export function ChartTooltip({ title, rows }: { title: React.ReactNode; rows: { label: string; value: React.ReactNode; swatch?: string }[] }) {
  return (
    <div className="min-w-36 rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <div className="mb-1 font-medium">{title}</div>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {row.swatch && <span className="size-2 rounded-full" style={{ background: row.swatch }} />}
            {row.label}
          </span>
          <span className="font-medium tabular-nums">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export const AXIS_TICK = { fontSize: 12, fill: "var(--muted-foreground)" };
