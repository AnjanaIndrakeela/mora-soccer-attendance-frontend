"use client";

import { AlertTriangle, Flame, LineChart as LineChartIcon, Table2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PercentBars, type PercentBarDatum } from "@/components/charts/percent-bars";
import { TrendChart } from "@/components/charts/trend-chart";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPercent, SESSION_TYPE_LABELS, teamTimeToIso, teamToday } from "@/lib/format";
import { useProgress } from "@/lib/queries";
import type { GroupStat, SessionType } from "@/lib/types";

const PRESETS = [
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
  { key: "365", label: "Last year", days: 365 },
  { key: "all", label: "All time", days: null },
] as const;

function daysAgo(days: number) {
  const d = new Date(`${teamToday()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const toBars = (rows: GroupStat[], label: (key: string) => string = (k) => k): PercentBarDatum[] =>
  rows.map((r) => ({ key: r.key, label: label(r.key), percent: r.percent, approved: r.approved, total: r.total }));

export default function ProgressPage() {
  const [preset, setPreset] = useState<string>("90");
  const [custom, setCustom] = useState({ from: daysAgo(90), to: teamToday() });
  const [breakdown, setBreakdown] = useState<"batch" | "position">("batch");
  const [playerView, setPlayerView] = useState<"chart" | "table">("chart");

  const range = useMemo(() => {
    if (preset === "custom") {
      return { from: custom.from ? teamTimeToIso(custom.from, "00:00") : undefined, to: custom.to ? teamTimeToIso(custom.to, "23:59") : undefined };
    }
    const p = PRESETS.find((x) => x.key === preset);
    return p?.days ? { from: teamTimeToIso(daysAgo(p.days), "00:00") } : {};
  }, [preset, custom]);

  const progress = useProgress(range);
  const d = progress.data;
  const threshold = d?.atRiskThreshold ?? 60;
  const players = (d?.perPlayer ?? []).filter((p) => p.total > 0).sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));

  return (
    <>
      <PageHeader title="Progress" description="Attendance trends and squad analysis." />

      {/* Filters: one row above the charts. */}
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={preset} onValueChange={(v) => setPreset(v as string)}>
          <TabsList>
            {PRESETS.map((p) => (
              <TabsTrigger key={p.key} value={p.key}>
                {p.label}
              </TabsTrigger>
            ))}
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
        </Tabs>
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" aria-label="From" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="w-40" />
            <span className="text-sm text-muted-foreground">to</span>
            <Input type="date" aria-label="To" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="w-40" />
          </div>
        )}
      </div>

      {progress.error && <ErrorState error={progress.error} onRetry={() => progress.refetch()} />}

      {/* Match record: three numbers, so stat tiles rather than a chart. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: "Wins", value: d?.matchRecord.WIN },
          { label: "Draws", value: d?.matchRecord.DRAW },
          { label: "Losses", value: d?.matchRecord.LOSS },
          { label: "Goals for", value: d?.matchRecord.goalsFor },
          { label: "Goals against", value: d?.matchRecord.goalsAgainst },
        ].map((s) => (
          <Card key={s.label} size="sm">
            <CardContent>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              {progress.isPending ? <Skeleton className="mt-1 h-7 w-10" /> : <div className="text-2xl font-semibold tabular-nums">{s.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance over time</CardTitle>
            <CardDescription>% of the squad present per week</CardDescription>
          </CardHeader>
          <CardContent>
            {progress.isPending ? (
              <Skeleton className="h-64" />
            ) : d && d.trend.length > 0 ? (
              <TrendChart data={d.trend} groupBy="week" />
            ) : (
              <EmptyState icon={LineChartIcon} title="No finalized sessions in this range" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By session type</CardTitle>
            <CardDescription>Attendance % for each kind of session</CardDescription>
          </CardHeader>
          <CardContent>
            {progress.isPending ? (
              <Skeleton className="h-40" />
            ) : d?.byType.length ? (
              <PercentBars data={toBars(d.byType, (k) => SESSION_TYPE_LABELS[k as SessionType] ?? k)} />
            ) : (
              <p className="text-sm text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By {breakdown}</CardTitle>
            <CardDescription>Attendance % across the squad</CardDescription>
            <CardAction>
              <Tabs value={breakdown} onValueChange={(v) => setBreakdown(v as "batch" | "position")}>
                <TabsList>
                  <TabsTrigger value="batch">Batch</TabsTrigger>
                  <TabsTrigger value="position">Position</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardAction>
          </CardHeader>
          <CardContent>
            {progress.isPending ? (
              <Skeleton className="h-40" />
            ) : d ? (
              <PercentBars data={toBars(breakdown === "batch" ? d.byBatch : d.byPosition, (k) => (breakdown === "batch" && k !== "Unspecified" ? `Batch ${k}` : k))} />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-status-critical" />
              At risk
            </CardTitle>
            <CardDescription>Players below {threshold}% attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {progress.isPending ? (
              <Skeleton className="h-32" />
            ) : d?.atRisk.length ? (
              <ul className="flex flex-col divide-y">
                {d.atRisk.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <Link href={`/team/${p.id}`} className="flex items-center gap-3 text-sm font-medium hover:underline">
                      <PlayerAvatar player={p} size="sm" />
                      {p.name}
                    </Link>
                    <span className="text-sm tabular-nums">
                      <span className="font-medium">{formatPercent(p.percent)}</span>
                      <span className="ml-1 text-muted-foreground">
                        ({p.approved}/{p.total})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nobody is below {threshold}%. 🎉</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4 text-brand" />
              Attendance streaks
            </CardTitle>
            <CardDescription>Consecutive sessions attended</CardDescription>
          </CardHeader>
          <CardContent>
            {progress.isPending ? (
              <Skeleton className="h-32" />
            ) : d?.streaks.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Longest</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.streaks.map((s) => (
                    <TableRow key={s.playerId}>
                      <TableCell>
                        <Link href={`/team/${s.playerId}`} className="hover:underline">
                          {s.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{s.current}</TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">{s.longest}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Per-player attendance</CardTitle>
            <CardDescription>
              Players below {threshold}% are flagged as at risk
              {playerView === "chart" && " and drawn in red"}.
            </CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => setPlayerView((v) => (v === "chart" ? "table" : "chart"))}>
                {playerView === "chart" ? <Table2 /> : <BarChart3 />}
                {playerView === "chart" ? "Table" : "Chart"}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {progress.isPending ? (
              <Skeleton className="h-96" />
            ) : players.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : playerView === "chart" ? (
              <PercentBars
                rowHeight={28}
                data={players.map((p) => ({
                  key: p.id,
                  label: p.name,
                  percent: p.percent,
                  approved: p.approved,
                  total: p.total,
                  flagged: p.percent !== null && p.percent < threshold,
                }))}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="hidden sm:table-cell">Batch</TableHead>
                    <TableHead className="hidden sm:table-cell">Position</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/team/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                        {p.percent !== null && p.percent < threshold && <span className="ml-2 text-xs text-status-critical">At risk</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{p.batch ?? "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{p.position ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.approved}/{p.total}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatPercent(p.percent)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
