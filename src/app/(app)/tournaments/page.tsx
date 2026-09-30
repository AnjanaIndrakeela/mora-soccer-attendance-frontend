"use client";

import {
  CalendarDays,
  ClipboardList,
  MapPin,
  Plus,
  Swords,
  Trash2,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/app-shell";
import { MotmStar } from "@/components/card-icons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Countdown } from "@/components/countdown";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { MatchReportDialog } from "@/components/match-report-dialog";
import { PageHeader } from "@/components/page-header";
import { MatchDialog, TournamentDialog } from "@/components/tournament-dialogs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api";
import { formatDate, formatShortDate } from "@/lib/format";
import {
  useDeleteMatch,
  useDeleteTournament,
  useFriendlies,
  useTournaments,
} from "@/lib/queries";
import type { Match, Tournament } from "@/lib/types";

const RESULT = {
  WIN: {
    label: "W",
    title: "Win",
    className: "bg-status-good/15 text-foreground ring-status-good/40",
  },
  DRAW: {
    label: "D",
    title: "Draw",
    className: "bg-muted text-foreground ring-border",
  },
  LOSS: {
    label: "L",
    title: "Loss",
    className: "bg-status-critical/15 text-foreground ring-status-critical/40",
  },
} as const;

function dateRange(t: Tournament) {
  return t.endDate && formatDate(t.endDate) !== formatDate(t.startDate)
    ? `${formatShortDate(t.startDate)} – ${formatDate(t.endDate)}`
    : formatDate(t.startDate);
}

export default function TournamentsPage() {
  const { isAdmin } = useCurrentUser();
  const upcoming = useTournaments(true);
  const past = useTournaments(false);
  const friendlies = useFriendlies();
  const [addingTournament, setAddingTournament] = useState(false);
  const [matchFor, setMatchFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Tournament | null>(null);
  const [reportFor, setReportFor] = useState<string | null>(null);
  const removeTournament = useDeleteTournament();

  const all = [...(upcoming.data ?? []), ...(past.data ?? [])];

  return (
    <>
      <PageHeader
        title="Tournaments"
        description="Upcoming tournaments, results and friendlies."
      >
        {isAdmin && (
          <>
            <Button variant="outline" onClick={() => setMatchFor("")}>
              <Swords />
              Log match
            </Button>
            <Button onClick={() => setAddingTournament(true)}>
              <Plus />
              Add tournament
            </Button>
          </>
        )}
      </PageHeader>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Upcoming</h2>
        {upcoming.error ? (
          <ErrorState
            error={upcoming.error}
            onRetry={() => upcoming.refetch()}
          />
        ) : upcoming.isPending ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : upcoming.data.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No upcoming tournaments"
            description={
              isAdmin ? "Add one to start the countdown." : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.data.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {dateRange(t)}
                    </span>
                    {t.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {t.venue}
                      </span>
                    )}
                  </CardDescription>
                  {isAdmin && (
                    <CardAction>
                      <TournamentAdminActions
                        onMatch={() => setMatchFor(t.id)}
                        onDelete={() => setDeleting(t)}
                      />
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Countdown to={t.startDate} />
                  {t.description && (
                    <p className="text-sm text-muted-foreground">
                      {t.description}
                    </p>
                  )}
                  {t.matches.length > 0 && <MatchList matches={t.matches} />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Past tournaments</h2>
        {past.error ? (
          <ErrorState error={past.error} onRetry={() => past.refetch()} />
        ) : past.isPending ? (
          <Skeleton className="h-40" />
        ) : past.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No past tournaments yet.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {past.data.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle>{t.name}</CardTitle>
                  <CardDescription>
                    {dateRange(t)}
                    {t.venue && ` · ${t.venue}`}
                  </CardDescription>
                  {isAdmin && (
                    <CardAction>
                      <TournamentAdminActions
                        onMatch={() => setMatchFor(t.id)}
                        onDelete={() => setDeleting(t)}
                      />
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent>
                  {t.matches.length ? (
                    <MatchList matches={t.matches} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No matches logged.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Friendlies</h2>
        <Card>
          <CardContent>
            {friendlies.isPending ? (
              <Skeleton className="h-20" />
            ) : friendlies.data?.length ? (
              <MatchList matches={friendlies.data} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No friendlies logged.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {isAdmin && (
        <>
          <TournamentDialog
            open={addingTournament}
            onOpenChange={setAddingTournament}
          />
          <MatchDialog
            open={matchFor !== null}
            onOpenChange={(open) => !open && setMatchFor(null)}
            tournaments={all}
            defaultTournamentId={matchFor ?? undefined}
            // A played match (with a score) goes straight on to its report.
            onCreated={(m) => m.scoreFor !== null && setReportFor(m.id)}
          />
          <MatchReportDialog
            matchId={reportFor}
            onOpenChange={(open) => !open && setReportFor(null)}
          />
          <ConfirmDialog
            open={Boolean(deleting)}
            onOpenChange={(open) => !open && setDeleting(null)}
            title={`Delete ${deleting?.name}?`}
            description="The tournament is deleted. Its matches are kept and listed as friendlies."
            confirmLabel="Delete tournament"
            destructive
            pending={removeTournament.isPending}
            onConfirm={() =>
              deleting &&
              removeTournament.mutate(deleting.id, {
                onSuccess: () => {
                  toast.success("Tournament deleted");
                  setDeleting(null);
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

function TournamentAdminActions({
  onMatch,
  onDelete,
}: {
  onMatch: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMatch}
        aria-label="Log a match in this tournament"
      >
        <Swords />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label="Delete tournament"
      >
        <Trash2 />
      </Button>
    </div>
  );
}

function MatchList({ matches }: { matches: Match[] }) {
  const { isAdmin } = useCurrentUser();
  const remove = useDeleteMatch();
  const [deleting, setDeleting] = useState<Match | null>(null);
  const [reportFor, setReportFor] = useState<string | null>(null);
  return (
    <>
      <ul className="flex flex-col divide-y text-sm">
        {matches.map((m) => {
          const result = m.result ? RESULT[m.result] : null;
          return (
            <li
              key={m.id}
              className="group flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-md text-xs font-semibold ring-1 ${result?.className ?? "text-muted-foreground ring-border"}`}
                  title={result?.title ?? "Not played yet"}
                >
                  {result?.label ?? "–"}
                </span>
                <div>
                  <div className="font-medium">vs {m.opponent}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(m.date)}
                  </div>
                  {m.manOfTheMatch && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs">
                      <MotmStar className="size-3.5" />
                      <span className="text-muted-foreground">
                        Man of the match:
                      </span>
                      {m.manOfTheMatch.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold tabular-nums">
                  {m.scoreFor !== null
                    ? `${m.scoreFor} – ${m.scoreAgainst}`
                    : "vs"}
                </span>
                {isAdmin && (
                  <Button
                    // Played matches without a report stand out.
                    variant={
                      m.scoreFor !== null && !m._count?.appearances
                        ? "outline"
                        : "ghost"
                    }
                    size="xs"
                    className="ml-1"
                    onClick={() => setReportFor(m.id)}
                    title={
                      m._count?.appearances
                        ? `${m._count.appearances} players in the report`
                        : "No report yet"
                    }
                  >
                    <ClipboardList />
                    {m._count?.appearances ? "Report" : "Add report"}
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-60 hover:opacity-100"
                    aria-label={`Delete match vs ${m.opponent}`}
                    disabled={remove.isPending}
                    onClick={() => setDeleting(m)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <MatchReportDialog
        matchId={reportFor}
        onOpenChange={(open) => !open && setReportFor(null)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete match vs ${deleting?.opponent}?`}
        description="The match and its report are removed from the record, the stats and players' points."
        confirmLabel="Delete match"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success("Match deleted");
              setDeleting(null);
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />
    </>
  );
}
