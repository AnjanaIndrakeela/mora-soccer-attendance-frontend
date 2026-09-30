"use client";

import Link from "next/link";
import { cn } from "cn";
import { CardCounts, MotmStar } from "@/components/card-icons";
import { PlayerAvatar } from "@/components/player-avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPercent } from "@/lib/format";
import type { PointsRow } from "@/lib/types";

/** Points leaderboard. `compact` drops the breakdown columns (dashboard card). */
export function PointsTable({ rows, compact = false }: { rows: PointsRow[]; compact?: boolean }) {
  // Rows arrive sorted by points, then attendance %. Players level on both share a rank.
  const ranked = rows.map((r) => ({
    ...r,
    rank: rows.findIndex((x) => x.points === r.points && x.attendance.percent === r.attendance.percent) + 1,
  }));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Player</TableHead>
          {!compact && (
            <>
              <TableHead className="text-right">Played</TableHead>
              <TableHead className="text-right">
                <span className="inline-flex items-center gap-1">
                  <MotmStar className="size-3.5" />
                  MOTM
                </span>
              </TableHead>
              <TableHead className="hidden text-right sm:table-cell">Cards</TableHead>
            </>
          )}
          <TableHead className="text-right">Attendance</TableHead>
          <TableHead className="text-right">Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ranked.map((r) => (
          <TableRow key={r.id}>
            <TableCell className={cn("tabular-nums", r.rank <= 3 ? "font-semibold" : "text-muted-foreground")}>{r.rank}</TableCell>
            <TableCell>
              <Link href={`/team/${r.id}`} className="flex items-center gap-3 font-medium hover:underline">
                <PlayerAvatar player={r} size="sm" />
                <span className="truncate">{r.name}</span>
              </Link>
            </TableCell>
            {!compact && (
              <>
                <TableCell className="text-right tabular-nums">{r.appearances}</TableCell>
                <TableCell className="text-right tabular-nums">{r.manOfTheMatch}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <CardCounts yellow={r.yellowCards} red={r.redCards} />
                </TableCell>
              </>
            )}
            <TableCell className="text-right text-muted-foreground tabular-nums">{formatPercent(r.attendance.percent)}</TableCell>
            <TableCell className={cn("text-right font-semibold tabular-nums", r.points < 0 && "text-status-critical")}>{r.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
