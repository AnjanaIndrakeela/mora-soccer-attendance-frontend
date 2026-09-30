"use client";

import { CalendarCheck, LineChart as LineChartIcon, Swords, Trophy, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/components/app-shell";
import { AttendanceDonut } from "@/components/charts/attendance-donut";
import { TrendChart } from "@/components/charts/trend-chart";
import { Countdown } from "@/components/countdown";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatPercent } from "@/lib/format";
import { useAttendanceTrend, useDashboardStats, usePendingClaims, usePlayer } from "@/lib/queries";
import { useState } from "react";

export default function DashboardPage() {
  const { user, isAdmin } = useCurrentUser();
  const stats = useDashboardStats();
  const [groupBy, setGroupBy] = useState<"session" | "week">("session");
  const trend = useAttendanceTrend({ groupBy, limit: groupBy === "week" ? 26 : 20 });
  const pending = usePendingClaims(isAdmin);
  const d = stats.data;

  return (
    <>
      <PageHeader title="Dashboard" description="Squad attendance at a glance." />

      {isAdmin && pending.data && pending.data.length > 0 && (
        <Link
          href="/team#pending"
          className="flex items-center gap-2 rounded-xl border border-status-warning/50 bg-status-warning/10 px-4 py-3 text-sm hover:bg-status-warning/20"
        >
          <UserCheck className="size-4" />
          {pending.data.length} sign-up{pending.data.length === 1 ? "" : "s"} waiting for confirmation
        </Link>
      )}

      {stats.error && <ErrorState error={stats.error} onRetry={() => stats.refetch()} />}

      {user?.playerId && <MyAttendance playerId={user.playerId} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered players" icon={Users} loading={stats.isPending} value={d?.totalPlayers} hint="Active on the roster" />
        <StatCard label="Sessions conducted" icon={CalendarCheck} loading={stats.isPending} value={d?.totalSessions} hint="Finalized sessions" />
        <StatCard label="Matches played" icon={Swords} loading={stats.isPending} value={d?.totalMatches} hint="Tournaments and friendlies" />
        <StatCard
          label="Next tournament"
          icon={Trophy}
          loading={stats.isPending}
          hint={d?.nextTournament ? `${d.nextTournament.name} · ${formatDate(d.nextTournament.startDate)}` : undefined}
        >
          {d?.nextTournament ? (
            <Countdown to={d.nextTournament.startDate} compact className="text-2xl font-semibold tracking-tight" />
          ) : (
            <div className="text-sm text-muted-foreground">
              None scheduled.{" "}
              <Link href="/tournaments" className="underline underline-offset-4">
                View tournaments
              </Link>
            </div>
          )}
        </StatCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overall attendance</CardTitle>
            <CardDescription>All records from finalized sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.isPending ? (
              <Skeleton className="h-48" />
            ) : d && d.attendance.total > 0 ? (
              <AttendanceDonut counts={d.attendance} percent={d.attendance.percent} />
            ) : (
              <EmptyState icon={CalendarCheck} title="No finalized sessions yet" description="Attendance appears here once a session is finalized." />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>Attendance trend</CardTitle>
              <CardDescription>% of the squad present {groupBy === "week" ? "per week" : "per session"}</CardDescription>
            </div>
            <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as "session" | "week")}>
              <TabsList>
                <TabsTrigger value="session">Sessions</TabsTrigger>
                <TabsTrigger value="week">Weeks</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {trend.isPending ? (
              <Skeleton className="h-64" />
            ) : trend.error ? (
              <ErrorState error={trend.error} onRetry={() => trend.refetch()} />
            ) : trend.data && trend.data.length > 0 ? (
              <TrendChart data={trend.data} groupBy={groupBy} />
            ) : (
              <EmptyState icon={LineChartIcon} title="No trend yet" description="Finalize a few sessions to see the trend." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function MyAttendance({ playerId }: { playerId: string }) {
  const player = usePlayer(playerId);
  if (!player.data) return null;
  const { attendance } = player.data;
  return (
    <Card size="sm">
      <CardContent className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm text-muted-foreground">Your attendance</div>
          <div className="text-2xl font-semibold">{formatPercent(attendance.percent)}</div>
        </div>
        <div className="text-sm text-muted-foreground">
          {attendance.approved} of {attendance.total} sessions since you joined ·{" "}
          <Link href={`/team/${playerId}`} className="text-foreground underline underline-offset-4">
            View profile
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
