"use client";

import { CalendarPlus, CalendarX, ClipboardCheck, MoreHorizontal, QrCode, Square, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { QrDialog } from "@/components/qr-dialog";
import { SessionFormDialog } from "@/components/session-form-dialog";
import { SessionStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/api";
import { formatPercent, formatTime, formatWeekdayDate, SESSION_TYPE_LABELS } from "@/lib/format";
import { useDeleteSession, useSessionAction, useSessions } from "@/lib/queries";
import type { Session } from "@/lib/types";

export default function SessionsPage() {
  const { isAdmin } = useCurrentUser();
  const [limit, setLimit] = useState(10);
  const sessions = useSessions({ limit });
  const [creating, setCreating] = useState(false);
  const [qrFor, setQrFor] = useState<Session | null>(null);
  const [ending, setEnding] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState<Session | null>(null);
  const end = useSessionAction("end");
  const remove = useDeleteSession();

  return (
    <>
      <PageHeader title="Sessions" description="Training sessions and QR check-in.">
        {isAdmin && (
          <Button onClick={() => setCreating(true)}>
            <CalendarPlus />
            Create session
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{limit === 10 ? "Latest sessions" : "All sessions"}</CardTitle>
          <CardDescription>Attendance % is shown once a session is finalized.</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.error ? (
            <ErrorState error={sessions.error} onRetry={() => sessions.refetch()} />
          ) : sessions.isPending ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : sessions.data.length === 0 ? (
            <EmptyState icon={CalendarX} title="No sessions yet" description={isAdmin ? "Create a session to generate its check-in QR code." : undefined}>
              {isAdmin && <Button onClick={() => setCreating(true)}>Create session</Button>}
            </EmptyState>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Attendance</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.data.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{formatWeekdayDate(s.startTime)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(s.startTime)}–{formatTime(s.endTime)}
                        </div>
                      </TableCell>
                      <TableCell>{SESSION_TYPE_LABELS[s.type]}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.status === "FINALIZED" ? (
                          formatPercent(s.attendancePercent)
                        ) : s.counts.PENDING + s.counts.APPROVED > 0 ? (
                          <span className="text-xs text-muted-foreground">{s.counts.PENDING + s.counts.APPROVED} checked in</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <SessionStatusBadge status={s.status} />
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <SessionActions session={s} onQr={() => setQrFor(s)} onEnd={() => setEnding(s)} onDelete={() => setDeleting(s)} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {limit === 10 && sessions.data.length === 10 && (
                <Button variant="ghost" className="mt-2 w-full" onClick={() => setLimit(200)}>
                  Show older sessions
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <SessionFormDialog open={creating} onOpenChange={setCreating} />
          <QrDialog session={qrFor} onOpenChange={(open) => !open && setQrFor(null)} />
          <ConfirmDialog
            open={Boolean(ending)}
            onOpenChange={(open) => !open && setEnding(null)}
            title="End this session?"
            description="Check-in closes immediately and further scans are rejected. You can then review and finalize attendance."
            confirmLabel="End session"
            pending={end.isPending}
            onConfirm={() =>
              ending &&
              end.mutate(ending.id, {
                onSuccess: () => {
                  toast.success("Session ended");
                  setEnding(null);
                },
                onError: (err) => toast.error(errorMessage(err)),
              })
            }
          />
          <ConfirmDialog
            open={Boolean(deleting)}
            onOpenChange={(open) => !open && setDeleting(null)}
            title="Delete this session?"
            description="The session and all of its attendance records are deleted permanently. Stats are recalculated without it."
            confirmLabel="Delete session"
            destructive
            pending={remove.isPending}
            onConfirm={() =>
              deleting &&
              remove.mutate(deleting.id, {
                onSuccess: () => {
                  toast.success("Session deleted");
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

function SessionActions({ session, onQr, onEnd, onDelete }: { session: Session; onQr: () => void; onEnd: () => void; onDelete: () => void }) {
  const open = session.status === "SCHEDULED" || session.status === "ACTIVE";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label="Session actions">
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {open && (
          <DropdownMenuItem onClick={onQr}>
            <QrCode />
            Show / download QR
          </DropdownMenuItem>
        )}
        {open && (
          <DropdownMenuItem onClick={onEnd}>
            <Square />
            End session
          </DropdownMenuItem>
        )}
        <DropdownMenuItem render={<Link href={`/sessions/${session.id}/review`} />}>
          <ClipboardCheck />
          {session.status === "FINALIZED" ? "View attendance" : "Review attendance"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
