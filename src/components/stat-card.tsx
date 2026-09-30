import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md hover:shadow-brand/10">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{label}</span>
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient text-brand-foreground shadow-sm shadow-brand/30">
            <Icon className="size-4" />
          </span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          children ?? <div className="text-3xl font-semibold tracking-tight">{value}</div>
        )}
        {hint && !loading && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
