"use client";

import { useSyncExternalStore } from "react";
import { cn } from "cn";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

// One shared 1-second clock. The server snapshot is null so server and first client render match.
let ticker: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  ticker ??= setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(ticker);
      ticker = undefined;
    }
  };
}
const useNow = () =>
  useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000) * 1000,
    () => null,
  );

/** Live countdown to a UTC instant, ticking every second. */
export function Countdown({ to, className, compact = false }: { to: string; className?: string; compact?: boolean }) {
  const now = useNow();

  const target = new Date(to).getTime();
  const p = parts(now === null ? 0 : target - now);
  const started = now !== null && target <= now;

  if (started) return <span className={cn("text-sm font-medium", className)}>Underway</span>;

  const units = [
    { label: "days", short: "d", value: p.days },
    { label: "hrs", short: "h", value: p.hours },
    { label: "min", short: "m", value: p.minutes },
    { label: "sec", short: "s", value: p.seconds },
  ];

  if (compact) {
    return (
      <span className={cn("tabular-nums", className)} suppressHydrationWarning>
        {now === null ? "—" : units.map((u) => `${u.value}${u.short}`).join(" ")}
      </span>
    );
  }

  return (
    <div className={cn("flex gap-2", className)} aria-live="off">
      {units.map((u) => (
        <div key={u.label} className="flex min-w-12 flex-col items-center rounded-lg bg-muted px-2 py-1.5">
          <span className="text-xl font-semibold tabular-nums">{now === null ? "–" : String(u.value).padStart(2, "0")}</span>
          <span className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
