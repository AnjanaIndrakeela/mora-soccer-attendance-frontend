"use client";

import { Minus, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { CardIcon, MotmStar } from "@/components/card-icons";
import { ErrorState } from "@/components/empty-state";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { formatPoints, matchPoints, POINTS } from "@/lib/points";
import { useMatchReport, usePlayers, useSaveMatchReport } from "@/lib/queries";
import type { MatchReport, Player } from "@/lib/types";

const UNPLAYED = { played: false, yellowCards: 0, redCards: 0 } as const satisfies Entry;

interface Entry {
  played: boolean;
  yellowCards: number;
  redCards: number;
}

/** Record who played, their cards and the man of the match. Saving replaces the match's report. */
export function MatchReportDialog({ matchId, onOpenChange }: { matchId: string | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={Boolean(matchId)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col sm:max-w-2xl">
        {matchId && <ReportLoader matchId={matchId} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ReportLoader({ matchId, onDone }: { matchId: string; onDone: () => void }) {
  const report = useMatchReport(matchId);
  const players = usePlayers({ sort: "name", includeInactive: true });

  if (report.error || players.error) return <ErrorState error={report.error ?? players.error} />;
  if (!report.data || !players.data) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }
  // Keyed so the form starts from the saved report each time it opens.
  return <ReportForm key={report.data.id + report.dataUpdatedAt} report={report.data} roster={players.data.items} onDone={onDone} />;
}

function ReportForm({ report, roster, onDone }: { report: MatchReport; roster: Player[]; onDone: () => void }) {
  const save = useSaveMatchReport(report.id);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<Record<string, Entry>>(() =>
    Object.fromEntries(report.appearances.map((a) => [a.player.id, { played: true, yellowCards: a.yellowCards, redCards: a.redCards }])),
  );
  const [motm, setMotm] = useState<string | null>(report.manOfTheMatch?.id ?? null);

  // Active players, plus anyone inactive who is already in this report.
  const players = useMemo(
    () => roster.filter((p) => p.isActive || entries[p.id]?.played).filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase())),
    [roster, entries, search],
  );
  const played = Object.entries(entries).filter(([, e]) => e.played);

  const update = (playerId: string, patch: Partial<Entry>) => {
    // Un-ticking a player clears their cards and, if needed, the man of the match.
    if (patch.played === false && motm === playerId) setMotm(null);
    setEntries((prev) => {
      const next: Entry = { ...(prev[playerId] ?? UNPLAYED), ...patch };
      return { ...prev, [playerId]: next.played ? next : UNPLAYED };
    });
  };

  const submit = () =>
    save.mutate(
      {
        appearances: played.map(([playerId, e]) => ({ playerId, yellowCards: e.yellowCards, redCards: e.redCards })),
        manOfTheMatchId: motm,
      },
      {
        onSuccess: () => {
          toast.success("Match report saved", { description: "Player points are updated." });
          onDone();
        },
      },
    );

  const score = report.scoreFor !== null ? ` · ${report.scoreFor}–${report.scoreAgainst}` : "";

  return (
    <>
      <DialogHeader>
        <DialogTitle>Match report: vs {report.opponent}</DialogTitle>
        <DialogDescription>
          {formatDate(report.date)}
          {score}
          {report.tournament && ` · ${report.tournament.name}`}. Tick who played, add cards, and pick the man of the match.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        <span>Played {formatPoints(POINTS.appearance)}</span>
        <span className="inline-flex items-center gap-1">
          <MotmStar className="size-3.5" /> Man of the match {formatPoints(POINTS.manOfTheMatch)}
        </span>
        <span className="inline-flex items-center gap-1">
          <CardIcon color="yellow" /> Yellow {POINTS.yellowCard}
        </span>
        <span className="inline-flex items-center gap-1">
          <CardIcon color="red" /> Red {POINTS.redCard}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a player" aria-label="Find a player" className="pl-8" />
        </div>
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{played.length} played</span>
      </div>

      {save.error && <ErrorState error={save.error} />}

      <ul className="-mx-4 flex min-h-0 flex-1 flex-col divide-y overflow-y-auto border-y px-4">
        {players.map((p) => {
          const e = entries[p.id] ?? UNPLAYED;
          const isMotm = motm === p.id;
          const pts = matchPoints({ ...e, manOfTheMatch: isMotm });
          return (
            <li key={p.id} className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5", !e.played && "opacity-70")}>
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={e.played}
                  onChange={(ev) => update(p.id, { played: ev.target.checked })}
                  className="size-4 shrink-0 accent-foreground"
                  aria-label={`${p.name} played`}
                />
                <PlayerAvatar player={p} size="sm" />
                <span className="truncate text-sm font-medium">
                  {p.name}
                  {p.jerseyNumber !== null && <span className="ml-1 font-normal text-muted-foreground">#{p.jerseyNumber}</span>}
                </span>
              </label>

              <div className="flex items-center gap-3">
                <Stepper
                  label={`${p.name} yellow cards`}
                  icon={<CardIcon color="yellow" />}
                  value={e.yellowCards}
                  max={2}
                  disabled={!e.played}
                  onChange={(v) => update(p.id, { yellowCards: v })}
                />
                <Stepper
                  label={`${p.name} red cards`}
                  icon={<CardIcon color="red" />}
                  value={e.redCards}
                  max={1}
                  disabled={!e.played}
                  onChange={(v) => update(p.id, { redCards: v })}
                />
                <Button
                  type="button"
                  size="sm"
                  variant={isMotm ? "default" : "outline"}
                  disabled={!e.played}
                  aria-pressed={isMotm}
                  onClick={() => setMotm(isMotm ? null : p.id)}
                  className={cn("w-20", isMotm && "bg-brand text-brand-foreground hover:bg-brand/90")}
                  title="Man of the match"
                >
                  <MotmStar className={isMotm ? "fill-brand-foreground text-brand-foreground" : undefined} />
                  MOTM
                </Button>
                <span className={cn("w-9 text-right text-sm font-medium tabular-nums", pts < 0 && "text-status-critical")}>{e.played ? formatPoints(pts) : ""}</span>
              </div>
            </li>
          );
        })}
        {players.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No players match &ldquo;{search}&rdquo;.</li>}
      </ul>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save report"}
        </Button>
      </DialogFooter>
    </>
  );
}

function Stepper({
  label,
  icon,
  value,
  max,
  disabled,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  max: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={label}>
      <Button type="button" variant="ghost" size="icon-xs" disabled={disabled || value === 0} onClick={() => onChange(value - 1)} aria-label={`Remove ${label}`}>
        <Minus />
      </Button>
      <span className="flex w-7 items-center justify-center gap-1 text-sm tabular-nums" aria-live="polite">
        {icon}
        {value}
      </span>
      <Button type="button" variant="ghost" size="icon-xs" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label={`Add ${label}`}>
        <Plus />
      </Button>
    </div>
  );
}
