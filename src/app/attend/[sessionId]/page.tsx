"use client";

import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { BrandMark } from "@/components/brand-mark";
import { AttendanceStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { formatTime, formatWeekdayDate, SESSION_TYPE_LABELS } from "@/lib/format";
import { useAttend, useCheckInPreview, type CheckInPreview } from "@/lib/queries";

/**
 * Mobile-first landing page opened by scanning a session QR code.
 * Shows the session, then the player confirms their participation; an admin approves it later.
 */
function Attend() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const token = useSearchParams().get("t");
  const preview = useCheckInPreview(sessionId, token);
  const attend = useAttend();

  // Not logged in (or the cookie expired): log in and come straight back to this page.
  const unauthorized = [preview.error, attend.error].some((e) => e instanceof ApiError && e.status === 401);
  useEffect(() => {
    if (unauthorized) router.replace(`/login?next=${encodeURIComponent(`/attend/${sessionId}?t=${token}`)}`);
  }, [unauthorized, router, sessionId, token]);

  let body: React.ReactNode;
  if (!token) {
    body = <Result tone="error" title="Invalid QR code" message="This link is missing its check-in code. Scan the QR code again." />;
  } else if (preview.isPending || unauthorized) {
    body = <Loading label="Loading session…" />;
  } else if (preview.isError) {
    body = <Result tone="error" title="Couldn't open this QR code" message={preview.error.message} />;
  } else if (attend.isSuccess) {
    body = (
      <Result
        tone="success"
        title={`Thanks, ${attend.data.player.name.split(" ")[0]}! You're checked in`}
        message={`Confirmed at ${formatTime(attend.data.record.scannedAt)}. Your attendance will count once an admin approves it.`}
      />
    );
  } else {
    body = <Confirm preview={preview.data} pending={attend.isPending} error={attend.error} onConfirm={() => attend.mutate({ sessionId, token })} />;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background bg-app-glow px-4 py-10">
      <BrandMark size={44} priority wordmarkClassName="text-foreground" accentClassName="text-brand-text" className="flex-col gap-3" />
      <Card className="relative w-full max-w-sm overflow-hidden shadow-xl shadow-black/5">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" aria-hidden />
        <CardContent>{body}</CardContent>
      </Card>
      <Link href="/dashboard" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Go to dashboard
      </Link>
    </main>
  );
}

function Confirm({
  preview,
  pending,
  error,
  onConfirm,
}: {
  preview: CheckInPreview;
  pending: boolean;
  error: Error | null;
  onConfirm: () => void;
}) {
  const { session, player, record, canCheckIn, reason } = preview;

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{player ? `Hi ${player.name.split(" ")[0]},` : "Session check-in"}</p>
        <h1 className="text-xl font-semibold">{SESSION_TYPE_LABELS[session.type]} session</h1>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-muted px-4 py-3 text-sm">
        <span className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          {formatWeekdayDate(session.startTime)}
        </span>
        <span className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          {formatTime(session.startTime)} – {formatTime(session.endTime)}
        </span>
      </div>

      {record ? (
        <div className="flex flex-col items-center gap-2 text-center" role="status">
          <CheckCircle2 className="size-10 text-status-good" />
          <p className="font-medium">You&apos;ve already checked in</p>
          <AttendanceStatusBadge status={record.status} />
          {record.scannedAt && <p className="text-xs text-muted-foreground">Confirmed at {formatTime(record.scannedAt)}</p>}
        </div>
      ) : canCheckIn ? (
        <>
          {error && (
            <p role="alert" className="text-center text-sm text-destructive">
              {error.message}
            </p>
          )}
          <Button size="lg" className="h-12 text-base" disabled={pending} onClick={onConfirm}>
            {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            {pending ? "Confirming…" : "Confirm my attendance"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">An admin reviews every check-in after the session.</p>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center" role="alert">
          <AlertTriangle className="size-10 text-status-critical" />
          <p className="text-sm text-muted-foreground">{reason}</p>
        </div>
      )}
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
      <Loader2 className="size-8 animate-spin" />
      {label}
    </div>
  );
}

function Result({ tone, title, message }: { tone: "success" | "error"; title: string; message: string }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center" role={tone === "error" ? "alert" : "status"}>
      <Icon className={`size-14 ${tone === "success" ? "text-status-good" : "text-status-critical"}`} />
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function AttendPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-background" />}>
      <Attend />
    </Suspense>
  );
}
