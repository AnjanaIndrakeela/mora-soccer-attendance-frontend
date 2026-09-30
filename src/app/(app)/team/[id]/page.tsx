"use client";

import { ArrowLeft, CalendarX, Pencil, Swords, UserX } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { useCurrentUser } from "@/components/app-shell";
import { CardCounts, CardIcon, MotmStar } from "@/components/card-icons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerFormDialog } from "@/components/player-form-dialog";
import { AttendanceStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/api";
import { formatDate, formatPercent, formatPlainDate, formatTime, SESSION_TYPE_LABELS } from "@/lib/format";
import { formatPoints, POINTS } from "@/lib/points";
import { useDeactivatePlayer, usePlayer, useSavePlayer } from "@/lib/queries";

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useCurrentUser();
  const player = usePlayer(id);
  const deactivate = useDeactivatePlayer();
  const reactivate = useSavePlayer(id);
  const [editing, setEditing] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  if (player.error) return <ErrorState error={player.error} onRetry={() => player.refetch()} />;
  if (player.isPending) return <Skeleton className="h-64" />;

  const p = player.data;
  // Index number, birthday and contact number are only returned to admins and the player themselves.
  const canSeePrivate = p.indexNo !== undefined;
  const details: [string, React.ReactNode][] = [
    ...(canSeePrivate ? ([["Index number", p.indexNo]] as [string, React.ReactNode][]) : []),
    ["Jersey number", p.jerseyNumber],
    ["Position", p.position],
    ["Batch", p.batch],
    ["Faculty", p.faculty],
    ["Department", p.department],
    ...(canSeePrivate
      ? ([
          ["Birthday", p.birthday ? formatPlainDate(p.birthday) : null],
          ["Contact number", p.contactNo],
        ] as [string, React.ReactNode][])
      : []),
    ["Joined", formatDate(p.joinedAt)],
  ];

  return (
    <>
      <Link href="/team" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 w-fit" })}>
        <ArrowLeft />
        Team
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <PlayerAvatar player={p} className="size-20" />
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              {p.name}
              {p.jerseyNumber !== null && <span className="text-muted-foreground">#{p.jerseyNumber}</span>}
            </h1>
            <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {p.position && <span>{p.position}</span>}
              {p.batch && <span>· Batch {p.batch}</span>}
              {!p.isActive && <Badge variant="outline">Inactive</Badge>}
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil />
              Edit
            </Button>
            {p.isActive ? (
              <Button variant="destructive" onClick={() => setConfirmDeactivate(true)}>
                <UserX />
                Deactivate
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={reactivate.isPending}
                onClick={() => {
                  const form = new FormData();
                  form.append("isActive", "true");
                  reactivate.mutate(form, {
                    onSuccess: () => toast.success(`${p.name} is active again`),
                    onError: (err) => toast.error(errorMessage(err)),
                  });
                }}
              >
                Reactivate
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Finalized sessions since joining</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="text-4xl font-semibold tracking-tight">{formatPercent(p.attendance.percent)}</div>
            <Progress value={p.attendance.percent ?? 0} aria-label="Attendance" />
            <div className="text-sm text-muted-foreground">
              Present at {p.attendance.approved} of {p.attendance.total} sessions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Points</CardTitle>
            <CardDescription>From match reports</CardDescription>
            <CardAction>
              <Link href="/points" className="text-sm underline-offset-4 hover:underline">
                Leaderboard
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className={cn("text-4xl font-semibold tracking-tight tabular-nums", p.points.points < 0 && "text-status-critical")}>{p.points.points}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
              {[
                { label: "Played", value: p.points.appearances, pts: p.points.appearances * POINTS.appearance, icon: null },
                { label: "Man of the match", value: p.points.manOfTheMatch, pts: p.points.manOfTheMatch * POINTS.manOfTheMatch, icon: <MotmStar className="size-3.5" /> },
                { label: "Yellow cards", value: p.points.yellowCards, pts: p.points.yellowCards * POINTS.yellowCard, icon: <CardIcon color="yellow" /> },
                { label: "Red cards", value: p.points.redCards, pts: p.points.redCards * POINTS.redCard, icon: <CardIcon color="red" /> },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                    {s.icon}
                    {s.label}
                  </dt>
                  <dd className="tabular-nums">
                    {s.value} <span className="text-xs text-muted-foreground">({formatPoints(s.pts)})</span>
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {details.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm">{value ?? "—"}</dd>
                  </div>
                ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matches</CardTitle>
          <CardDescription>Last 20 matches played, with points earned</CardDescription>
        </CardHeader>
        <CardContent>
          {p.matchHistory.length === 0 ? (
            <EmptyState icon={Swords} title="No matches yet" description="Matches appear here once they're in a match report." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match</TableHead>
                  <TableHead className="hidden sm:table-cell">Score</TableHead>
                  <TableHead>Cards</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.matchHistory.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium">
                        vs {m.opponent}
                        {m.manOfTheMatch && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-normal text-muted-foreground" title="Man of the match">
                            <MotmStar className="size-3.5" />
                            MOTM
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(m.date)}
                        {m.tournament && ` · ${m.tournament.name}`}
                      </div>
                    </TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{m.scoreFor !== null ? `${m.scoreFor}–${m.scoreAgainst}` : "—"}</TableCell>
                    <TableCell>
                      <CardCounts yellow={m.yellowCards} red={m.redCards} />
                    </TableCell>
                    <TableCell className={cn("text-right font-medium tabular-nums", m.points < 0 && "text-status-critical")}>{formatPoints(m.points)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
          <CardDescription>Last 20 finalized sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {p.recentAttendance.length === 0 ? (
            <EmptyState icon={CalendarX} title="No finalized sessions yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Checked in</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.recentAttendance.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDate(r.session.startTime)}</TableCell>
                    <TableCell>{SESSION_TYPE_LABELS[r.session.type]}</TableCell>
                    <TableCell className="hidden sm:table-cell">{r.scannedAt ? formatTime(r.scannedAt) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <AttendanceStatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <PlayerFormDialog open={editing} onOpenChange={setEditing} player={p} />
          <ConfirmDialog
            open={confirmDeactivate}
            onOpenChange={setConfirmDeactivate}
            title={`Deactivate ${p.name}?`}
            description="They'll be removed from the roster and won't be marked absent in future sessions. Their attendance history is kept, and you can reactivate them later."
            confirmLabel="Deactivate"
            destructive
            pending={deactivate.isPending}
            onConfirm={() =>
              deactivate.mutate(p.id, {
                onSuccess: () => {
                  toast.success(`${p.name} deactivated`);
                  setConfirmDeactivate(false);
                },
                onError: (err) => toast.error(errorMessage(err)),
              })
            }
          />
        </>
      )}
    </>
  );
}
