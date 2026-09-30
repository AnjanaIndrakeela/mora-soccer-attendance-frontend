"use client";

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { formatTime, formatWeekdayDate, SESSION_TYPE_LABELS } from "@/lib/format";
import { useAttend } from "@/lib/queries";

/** Mobile-first landing page opened by scanning a session QR code. */
function Attend() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const token = useSearchParams().get("t");
  const attend = useAttend();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !token) return;
    started.current = true;
    attend.mutate({ sessionId, token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  // Session cookie missing or expired: log in and come straight back here.
  const unauthorized = attend.error instanceof ApiError && attend.error.status === 401;
  useEffect(() => {
    if (unauthorized) router.replace(`/login?next=${encodeURIComponent(`/attend/${sessionId}?t=${token}`)}`);
  }, [unauthorized, router, sessionId, token]);

  let body: React.ReactNode;
  if (!token) {
    body = <Result tone="error" title="Invalid QR code" message="This link is missing its check-in code. Scan the QR code again." />;
  } else if (attend.isSuccess) {
    const { session, record, player } = attend.data;
    body = (
      <Result
        tone="success"
        title={`You're checked in, ${player.name.split(" ")[0]}!`}
        message={`${SESSION_TYPE_LABELS[session.type]} · ${formatWeekdayDate(session.startTime)}, ${formatTime(session.startTime)}–${formatTime(session.endTime)}. Scanned at ${formatTime(record.scannedAt)}. An admin will confirm your attendance.`}
      />
    );
  } else if (attend.isError && !unauthorized) {
    const already = attend.error instanceof ApiError && attend.error.status === 409 && /already/.test(attend.error.message);
    body = already ? (
      <Result tone="success" title="Already checked in" message="You've already scanned in to this session. Nothing more to do." />
    ) : (
      <Result tone="error" title="Couldn't check you in" message={attend.error.message}>
        <Button variant="outline" onClick={() => attend.mutate({ sessionId, token })}>
          Try again
        </Button>
      </Result>
    );
  } else {
    body = (
      <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
        Checking you in…
      </div>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#0b0b0b] px-4 py-10">
      <Image src="/logo.jpg" alt="Mora Football" width={80} height={80} className="rounded-full" priority />
      <Card className="w-full max-w-sm">
        <CardContent>{body}</CardContent>
      </Card>
      <Link href="/dashboard" className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline">
        Go to dashboard
      </Link>
    </main>
  );
}

function Result({ tone, title, message, children }: { tone: "success" | "error"; title: string; message: string; children?: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center" role={tone === "error" ? "alert" : "status"}>
      <Icon className={`size-14 ${tone === "success" ? "text-status-good" : "text-status-critical"}`} />
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}

export default function AttendPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#0b0b0b]" />}>
      <Attend />
    </Suspense>
  );
}

