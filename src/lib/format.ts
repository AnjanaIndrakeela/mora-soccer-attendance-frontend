import type { SessionType } from "./types";

/** All timestamps are stored in UTC and displayed in the team's timezone. */
export const TEAM_TIMEZONE = process.env.NEXT_PUBLIC_TEAM_TIMEZONE ?? "Asia/Colombo";

const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TEAM_TIMEZONE, ...options });

const dateFmt = fmt({ day: "numeric", month: "short", year: "numeric" });
const shortDateFmt = fmt({ day: "numeric", month: "short" });
const weekdayDateFmt = fmt({ weekday: "short", day: "numeric", month: "short" });
const timeFmt = fmt({ hour: "numeric", minute: "2-digit", hour12: true });

export const formatDate = (d: string | Date) => dateFmt.format(new Date(d));
export const formatShortDate = (d: string | Date) => shortDateFmt.format(new Date(d));
export const formatWeekdayDate = (d: string | Date) => weekdayDateFmt.format(new Date(d));
export const formatTime = (d: string | Date) => timeFmt.format(new Date(d));
export const formatDateTime = (d: string | Date) => `${formatDate(d)}, ${formatTime(d)}`;

/** Date-only values (birthdays, session dates) are stored as UTC midnight; format them without shifting. */
export const formatPlainDate = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

export const formatPercent = (p: number | null | undefined) => (p === null || p === undefined ? "—" : `${Math.round(p)}%`);

/** Offset of the team timezone from UTC at a given instant, in minutes. */
function tzOffsetMinutes(instant: Date): number {
  const parts = fmt({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
    .formatToParts(instant)
    .reduce<Record<string, number>>((acc, p) => (p.type === "literal" ? acc : { ...acc, [p.type]: Number(p.value) }), {});
  const asUtc = Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour!, parts.minute!, parts.second!);
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** Converts a wall-clock date + time in the team timezone ("2026-10-01", "16:30") to a UTC ISO string. */
export function teamTimeToIso(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!);
  const offset = tzOffsetMinutes(new Date(guess));
  return new Date(guess - offset * 60000).toISOString();
}

/** Today's date in the team timezone as YYYY-MM-DD. */
export function teamToday(): string {
  return fmt({ year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("/").reverse().join("-");
}

/** YYYY-MM-DD for a date-only value (stored as UTC midnight). */
export const toDateInput = (d: string | null | undefined) => (d ? d.slice(0, 10) : "");

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  PRACTICE: "Practice",
  FITNESS: "Fitness",
  MATCH_PREP: "Match prep",
  OTHER: "Other",
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
