"use client";

import { Medal } from "lucide-react";
import { CardIcon, MotmStar } from "@/components/card-icons";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PointsTable } from "@/components/points-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPoints } from "@/lib/points";
import { usePointsTable } from "@/lib/queries";

export default function PointsPage() {
  const table = usePointsTable();
  const rules = table.data?.rules;
  const anyPoints = table.data?.players.some((p) => p.appearances > 0 || p.manOfTheMatch > 0);

  return (
    <>
      <PageHeader title="Points" description="Earned from match reports: appearances, man of the match awards and cards." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>Active players, all matches. Players level on points are ordered by attendance %.</CardDescription>
          </CardHeader>
          <CardContent>
            {table.error ? (
              <ErrorState error={table.error} onRetry={() => table.refetch()} />
            ) : table.isPending ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : !anyPoints ? (
              <EmptyState icon={Medal} title="No points yet" description="Points appear once an admin adds match reports on the Tournaments page." />
            ) : (
              <PointsTable rows={table.data.players} />
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>How points work</CardTitle>
            <CardDescription>Per match, from the match report</CardDescription>
          </CardHeader>
          <CardContent>
            {rules ? (
              <ul className="flex flex-col divide-y text-sm">
                {[
                  { icon: <span className="size-4" />, label: "Played in the match", value: rules.appearance },
                  { icon: <MotmStar />, label: "Man of the match", value: rules.manOfTheMatch },
                  { icon: <CardIcon color="yellow" className="mx-0.5" />, label: "Each yellow card", value: rules.yellowCard },
                  { icon: <CardIcon color="red" className="mx-0.5" />, label: "Each red card", value: rules.redCard },
                ].map((r) => (
                  <li key={r.label} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <span className="flex items-center gap-2">
                      {r.icon}
                      {r.label}
                    </span>
                    <span className="font-semibold tabular-nums">{formatPoints(r.value)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Skeleton className="h-32" />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
