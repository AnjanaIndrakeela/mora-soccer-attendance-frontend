import { CheckCircle2, CircleDashed, CircleDot, Clock, Lock, MinusCircle, XCircle } from "lucide-react";
import { cn } from "cn";
import type { AttendanceStatus, SessionStatus } from "@/lib/types";

const base = "inline-flex h-5 items-center gap-1 rounded-full border px-2 text-xs font-medium whitespace-nowrap [&>svg]:size-3";

const SESSION: Record<SessionStatus, { label: string; icon: typeof Clock; className: string }> = {
  SCHEDULED: { label: "Scheduled", icon: Clock, className: "border-border text-muted-foreground" },
  ACTIVE: { label: "Active", icon: CircleDot, className: "border-status-good/40 bg-status-good/10 text-foreground" },
  ENDED: { label: "Ended", icon: CircleDashed, className: "border-status-warning/50 bg-status-warning/10 text-foreground" },
  FINALIZED: { label: "Finalized", icon: Lock, className: "border-transparent bg-secondary text-secondary-foreground" },
};

// Status colors always come with an icon and a label, never color alone.
const ATTENDANCE: Record<AttendanceStatus, { label: string; icon: typeof Clock; className: string; iconClass: string }> = {
  PENDING: { label: "Pending", icon: Clock, className: "border-border", iconClass: "text-muted-foreground" },
  APPROVED: { label: "Approved", icon: CheckCircle2, className: "border-status-good/40 bg-status-good/10", iconClass: "text-status-good" },
  REJECTED: { label: "Rejected", icon: XCircle, className: "border-status-serious/40 bg-status-serious/10", iconClass: "text-status-serious" },
  ABSENT: { label: "Absent", icon: MinusCircle, className: "border-status-critical/40 bg-status-critical/10", iconClass: "text-status-critical" },
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const { label, icon: Icon, className } = SESSION[status];
  return (
    <span className={cn(base, className)}>
      <Icon className={status === "ACTIVE" ? "text-status-good" : undefined} />
      {label}
    </span>
  );
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const { label, icon: Icon, className, iconClass } = ATTENDANCE[status];
  return (
    <span className={cn(base, "text-foreground", className)}>
      <Icon className={iconClass} />
      {label}
    </span>
  );
}
