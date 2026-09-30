"use client";

import { Download, Maximize2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Countdown } from "@/components/countdown";
import { ErrorState } from "@/components/empty-state";
import { SessionStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, formatWeekdayDate, SESSION_TYPE_LABELS } from "@/lib/format";
import { useSessionQr } from "@/lib/queries";
import type { Session } from "@/lib/types";

export function QrDialog({ session, onOpenChange }: { session: Session | null; onOpenChange: (open: boolean) => void }) {
  const qr = useSessionQr(session?.id ?? null);
  const [fullscreen, setFullscreen] = useState(false);

  const download = () => {
    if (!qr.data || !session) return;
    const a = document.createElement("a");
    a.href = qr.data.pngDataUrl;
    a.download = `session-${session.startTime.slice(0, 10)}-${session.type.toLowerCase()}-qr.png`;
    a.click();
  };

  return (
    <>
      <Dialog open={Boolean(session) && !fullscreen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          {session && (
            <>
              <DialogHeader>
                <DialogTitle>Check-in QR code</DialogTitle>
                <DialogDescription>
                  {SESSION_TYPE_LABELS[session.type]} · {formatWeekdayDate(session.startTime)}, {formatTime(session.startTime)}–{formatTime(session.endTime)}
                </DialogDescription>
              </DialogHeader>
              {qr.error ? (
                <ErrorState error={qr.error} onRetry={() => qr.refetch()} />
              ) : !qr.data ? (
                <Skeleton className="aspect-square w-full" />
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl bg-white p-2">
                    <Image src={qr.data.pngDataUrl} alt="Session check-in QR code" width={512} height={512} unoptimized className="h-auto w-full" />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Players scan this with their phone camera. The code stops working after the session ends.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={download}>
                      <Download />
                      Download
                    </Button>
                    <Button onClick={() => setFullscreen(true)}>
                      <Maximize2 />
                      Full screen
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      {fullscreen && session && qr.data && <FullscreenQr session={session} png={qr.data.pngDataUrl} onClose={() => setFullscreen(false)} />}
    </>
  );
}

/** Shown on a phone or laptop at practice. Uses the Fullscreen API where available. */
function FullscreenQr({ session, png, onClose }: { session: Session; png: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    el?.requestFullscreen?.().catch(() => {});
    const onChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [onClose]);

  return (
    <div ref={ref} className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 bg-white p-6 text-black" role="dialog" aria-label="Full-screen QR code">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full p-2 text-black/60 hover:bg-black/5 hover:text-black"
        aria-label="Exit full screen"
      >
        <X className="size-6" />
      </button>
      <div className="flex items-center gap-3">
        <Image src="/logo.jpg" alt="" width={48} height={48} className="rounded-full" />
        <div>
          <div className="text-xl font-semibold">Scan to check in</div>
          <div className="text-sm text-black/60">
            {SESSION_TYPE_LABELS[session.type]} · {formatWeekdayDate(session.startTime)}, {formatTime(session.startTime)}–{formatTime(session.endTime)}
          </div>
        </div>
      </div>
      <Image src={png} alt="Session check-in QR code" width={1024} height={1024} unoptimized className="aspect-square h-auto w-full max-w-[min(80vh,80vw)]" />
      <div className="flex items-center gap-2 text-sm text-black/60">
        <SessionStatusBadge status={session.status} />
        {session.status !== "ENDED" && session.status !== "FINALIZED" && (
          <span>
            Ends in <Countdown to={session.endTime} compact />
          </span>
        )}
      </div>
    </div>
  );
}
