"use client";

import { ArrowLeft, Check, CheckCheck, Lock, QrCode, ScanLine, Square, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { PlayerAvatar } from "@/components/player-avatar";
import { QrDialog } from "@/components/qr-dialog";
import { AttendanceStatusBadge, SessionStatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api";
import { formatPercent, formatTime, formatWeekdayDate, SESSION_TYPE_LABELS } from "@/lib/format";
import { usePlayers, useReviewAttendance, useSessionAction, useSessionAttendance, useSetPlayerAttendance } from "@/lib/queries";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";

const ORDER: Record<AttendanceStatus, number> = { PENDING: 0, APPROVED: 1, REJECTED: 2, ABSENT: 3 };

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useCurrentUser();
  const data = useSessionAttendance(id);
  const review = useReviewAttendance();
  const approveAll = useSessionAction("approve-all");
  const finalize = useSessionAction("finalize");
  const end = useSessionAction("end");
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const records = useMemo(
    () => [...(data.data?.records ?? [])].sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.scannedAt ?? "").localeCompare(b.scannedAt ?? "")),
    [data.data],
  );

  if (!isAdmin) return <ErrorState error={new Error("Only admins can review attendance.")} />;
  if (data.error) return <ErrorState error={data.error} onRetry={() => data.refetch()} />;
  if (data.isPending) return <Skeleton className="h-96" />;

  const { session } = data.data;
  const pending = session.counts.PENDING;
  const finalized = session.status === "FINALIZED";
  const open = session.status === "SCHEDULED" || session.status === "ACTIVE";

  const setStatus = (record: AttendanceRecord, status: "APPROVED" | "REJECTED") => {
    const left = record.status === "PENDING" ? pending - 1 : pending;
    review.mutate(
      { recordId: record.id, status },
      {
        onSuccess: () =>
          toast.success(`${status === "APPROVED" ? "Approved" : "Rejected"} ${record.player.name}`, {
            description: finalized ? "Stats updated." : left > 0 ? `${left} left to review` : "All check-ins reviewed",
          }),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <>
      <Link href="/sessions" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 w-fit" })}>
        <ArrowLeft />
        Sessions
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            {finalized ? "Attendance" : "Review attendance"}
            <SessionStatusBadge status={session.status} />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {SESSION_TYPE_LABELS[session.type]} · {formatWeekdayDate(session.startTime)}, {formatTime(session.startTime)}–{formatTime(session.endTime)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {open && (
            <>
              <Button variant="outline" onClick={() => setShowQr(true)}>
                <QrCode />
                Show QR
              </Button>
              <Button
                variant="outline"
                disabled={end.isPending}
                onClick={() => end.mutate(id, { onSuccess: () => toast.success("Session ended"), onError: (err) => toast.error(errorMessage(err)) })}
              >
                <Square />
                End session
              </Button>
            </>
          )}
          {!finalized && pending > 0 && (
            <Button
              variant="outline"
              disabled={approveAll.isPending}
              onClick={() =>
                approveAll.mutate(id, {
                  onSuccess: () => toast.success(`Approved ${pending} record${pending === 1 ? "" : "s"}`),
                  onError: (err) => toast.error(errorMessage(err)),
                })
              }
            >
              <CheckCheck />
              Approve all remaining ({pending})
            </Button>
          )}
          {!finalized && (
            <Button disabled={session.status !== "ENDED" || pending > 0} onClick={() => setConfirmFinalize(true)}>
              <Lock />
              Finalize
            </Button>
          )}
        </div>
      </div>

      {!finalized && (open || pending > 0) && (
        <p className="text-sm text-muted-foreground">
          {open
            ? "Check-in is open. Players' confirmations appear here automatically. You can approve them now or after the session ends."
            : `Approve or reject each of the ${pending} pending check-in${pending === 1 ? "" : "s"}, then finalize.`}
        </p>
      )}

      {!finalized && !open && pending === 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-status-good/40 bg-status-good/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm">
            <CheckCheck className="mt-0.5 size-4 shrink-0 text-status-good" />
            <span>
              <span className="font-medium">All check-ins reviewed.</span> Finalize to mark everyone else absent and update attendance across the site:
              player percentages, the dashboard and progress charts.
            </span>
          </div>
          <Button onClick={() => setConfirmFinalize(true)} className="shrink-0">
            <Lock />
            Finalize &amp; update stats
          </Button>
        </div>
      )}

      {finalized && (
        <p className="text-sm text-muted-foreground">
          This session counts towards attendance stats. Changing a record here updates them straight away.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        {(["PENDING", "APPROVED", "REJECTED", "ABSENT"] as const).map((s) => (
          <Card key={s} size="sm">
            <CardContent className="flex items-center justify-between">
              <AttendanceStatusBadge status={s} />
              <span className="text-2xl font-semibold tabular-nums">{session.counts[s]}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      {finalized && <p className="text-sm text-muted-foreground">Attendance: {formatPercent(session.attendancePercent)}</p>}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Players</CardTitle>
            <CardDescription>{records.length} record{records.length === 1 ? "" : "s"}</CardDescription>
          </div>
          <ManualAdd sessionId={id} existing={records} />
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState icon={ScanLine} title="No check-ins yet" description="Scans show up here as players check in." />
          ) : (
            <ul className="flex flex-col divide-y">
              {records.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar player={r.player} size="lg" />
                    <div>
                      <div className="font-medium">
                        {r.player.name}
                        {r.player.jerseyNumber !== null && <span className="ml-1 text-muted-foreground">#{r.player.jerseyNumber}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.scannedAt ? `Scanned ${formatTime(r.scannedAt)}` : "Added by admin"}
                        {r.player.position && ` · ${r.player.position}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AttendanceStatusBadge status={r.status} />
                    {r.status !== "APPROVED" && (
                      <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => setStatus(r, "APPROVED")} aria-label={`Approve ${r.player.name}`}>
                        <Check />
                        Approve
                      </Button>
                    )}
                    {r.status !== "REJECTED" && r.status !== "ABSENT" && (
                      <Button size="sm" variant="ghost" disabled={review.isPending} onClick={() => setStatus(r, "REJECTED")} aria-label={`Reject ${r.player.name}`}>
                        <X />
                        Reject
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <QrDialog session={showQr ? session : null} onOpenChange={setShowQr} />
      <ConfirmDialog
        open={confirmFinalize}
        onOpenChange={setConfirmFinalize}
        title="Finalize this session?"
        description="Active players without a record are marked absent, and the session starts counting towards attendance stats. You can still correct individual records afterwards."
        confirmLabel="Finalize"
        pending={finalize.isPending}
        onConfirm={() =>
          finalize.mutate(id, {
            onSuccess: () => {
              toast.success("Session finalized");
              setConfirmFinalize(false);
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />
    </>
  );
}

/** Mark a player present by hand, e.g. when they forgot their phone. */
function ManualAdd({ sessionId, existing }: { sessionId: string; existing: AttendanceRecord[] }) {
  const players = usePlayers({ sort: "name" });
  const add = useSetPlayerAttendance(sessionId);
  const [playerId, setPlayerId] = useState("");

  const taken = new Set(existing.map((r) => r.player.id));
  const options = (players.data?.items ?? []).filter((p) => !taken.has(p.id));
  if (options.length === 0) return null;

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!playerId) return;
        add.mutate(
          { playerId, status: "APPROVED" },
          {
            onSuccess: () => {
              toast.success("Marked present");
              setPlayerId("");
            },
            onError: (err) => toast.error(errorMessage(err)),
          },
        );
      }}
    >
      <NativeSelect value={playerId} onChange={(e) => setPlayerId(e.target.value)} aria-label="Player to mark present" className="w-52">
        <option value="">Add a player…</option>
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </NativeSelect>
      <Button type="submit" size="sm" variant="outline" disabled={!playerId || add.isPending}>
        <UserPlus />
        Mark present
      </Button>
    </form>
  );
}
