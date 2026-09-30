import { Star } from "lucide-react";
import { cn } from "cn";

/** Referee cards and the MOTM star. They always come with a count or label, never color alone. */
export function CardIcon({ color, className }: { color: "yellow" | "red"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-3.5 w-2.5 rounded-[2px] ring-1 ring-black/10", color === "yellow" ? "bg-[#fbc02d]" : "bg-[#d32f2f]", className)}
    />
  );
}

export function MotmStar({ className }: { className?: string }) {
  return <Star aria-hidden className={cn("size-4 fill-brand text-brand", className)} />;
}

/** "🟨 2 🟥 1" style summary with accessible text. */
export function CardCounts({ yellow, red }: { yellow: number; red: number }) {
  if (!yellow && !red) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-2 tabular-nums">
      {yellow > 0 && (
        <span className="inline-flex items-center gap-1" title={`${yellow} yellow card${yellow === 1 ? "" : "s"}`}>
          <CardIcon color="yellow" />
          {yellow}
          <span className="sr-only">yellow</span>
        </span>
      )}
      {red > 0 && (
        <span className="inline-flex items-center gap-1" title={`${red} red card${red === 1 ? "" : "s"}`}>
          <CardIcon color="red" />
          {red}
          <span className="sr-only">red</span>
        </span>
      )}
    </span>
  );
}
