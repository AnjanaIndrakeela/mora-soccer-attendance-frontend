"use client";

import { Check, Search, UserPlus, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/app-shell";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerFormDialog } from "@/components/player-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/api";
import { formatDate, formatPercent } from "@/lib/format";
import { usePendingClaims, usePlayers, useResolveClaim } from "@/lib/queries";

export default function TeamPage() {
  const { isAdmin } = useCurrentUser();
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [adding, setAdding] = useState(false);
  // Points take priority; attendance % breaks ties.
  const players = usePlayers(
    showAll ? { sort: "points", search: deferredSearch || undefined, includeInactive: isAdmin } : { sort: "points", limit: 10 },
  );

  return (
    <>
      <PageHeader title="Team" description={showAll ? "The full roster, ordered by points, then attendance." : "Top 10 players by points, then attendance."}>
        {isAdmin && (
          <Button onClick={() => setAdding(true)}>
            <UserPlus />
            Add player
          </Button>
        )}
      </PageHeader>

      {isAdmin && <PendingClaims />}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>{showAll ? "All players" : "Top players"}</CardTitle>
            {players.data && (
              <CardDescription>
                {showAll ? `${players.data.total} player${players.data.total === 1 ? "" : "s"}` : `Showing ${players.data.items.length} of ${players.data.total}`}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showAll && (
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or index no."
                  aria-label="Search players"
                  className="w-56 pl-8"
                />
              </div>
            )}
            <Button variant="outline" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show top 10" : "View all"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {players.error ? (
            <ErrorState error={players.error} onRetry={() => players.refetch()} />
          ) : players.isPending ? (
            <TableSkeleton />
          ) : players.data.items.length === 0 ? (
            <EmptyState
              icon={Users}
              title={deferredSearch ? "No players match your search" : "No players yet"}
              description={isAdmin && !deferredSearch ? "Add players to the roster so they can sign up and check in." : undefined}
            />
          ) : (
            <PlayerTable players={players.data.items} ranked={!deferredSearch} />
          )}
        </CardContent>
      </Card>

      <PlayerFormDialog open={adding} onOpenChange={setAdding} />
    </>
  );
}

function PlayerTable({ players, ranked }: { players: NonNullable<ReturnType<typeof usePlayers>["data"]>["items"]; ranked: boolean }) {
  const router = useRouter();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {ranked && <TableHead className="w-10">#</TableHead>}
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Number</TableHead>
          <TableHead className="hidden sm:table-cell">Batch</TableHead>
          <TableHead className="hidden sm:table-cell">Position</TableHead>
          <TableHead className="text-right">Attendance</TableHead>
          <TableHead className="text-right text-foreground" aria-sort="descending">
            Points
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((p, i) => (
          <TableRow key={p.id} className="cursor-pointer" onClick={() => router.push(`/team/${p.id}`)}>
            {ranked && <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>}
            <TableCell>
              <Link href={`/team/${p.id}`} className="flex items-center gap-3 font-medium" onClick={(e) => e.stopPropagation()}>
                <PlayerAvatar player={p} />
                <span>
                  {p.name}
                  {!p.isActive && (
                    <Badge variant="outline" className="ml-2">
                      Inactive
                    </Badge>
                  )}
                </span>
              </Link>
            </TableCell>
            <TableCell className="text-right tabular-nums">{p.jerseyNumber ?? "—"}</TableCell>
            <TableCell className="hidden sm:table-cell">{p.batch ?? "—"}</TableCell>
            <TableCell className="hidden sm:table-cell">{p.position ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">
              <span className="font-medium">{formatPercent(p.attendance.percent)}</span>
              <span className="ml-1 hidden text-xs text-muted-foreground md:inline">
                ({p.attendance.approved}/{p.attendance.total})
              </span>
            </TableCell>
            <TableCell className={`text-right font-medium tabular-nums ${p.points.points < 0 ? "text-status-critical" : ""}`}>{p.points.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PendingClaims() {
  const pending = usePendingClaims();
  const resolve = useResolveClaim();
  if (!pending.data?.length) return null;

  const act = (userId: string, approve: boolean, name: string) =>
    resolve.mutate(
      { userId, approve },
      {
        onSuccess: () => toast.success(approve ? `Confirmed ${name}` : `Rejected sign-up for ${name}`),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );

  return (
    <Card id="pending" className="ring-status-warning/50">
      <CardHeader>
        <CardTitle>Pending sign-ups</CardTitle>
        <CardDescription>These accounts claimed a roster entry. Confirm them so they can check in to sessions.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {pending.data.map((claim) => (
          <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <PlayerAvatar player={claim.player} />
              <div>
                <div className="font-medium">
                  {claim.player.name} <span className="text-muted-foreground">· {claim.player.indexNo}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {claim.email} · signed up {formatDate(claim.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={resolve.isPending} onClick={() => act(claim.id, false, claim.player.name)}>
                <X />
                Reject
              </Button>
              <Button size="sm" disabled={resolve.isPending} onClick={() => act(claim.id, true, claim.player.name)}>
                <Check />
                Confirm
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}
