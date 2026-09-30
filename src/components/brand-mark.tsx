import Image from "next/image";
import { cn } from "cn";

/**
 * University of Moratuwa crest followed by the Mora Football crest, on a white pill so
 * the (transparent, dark-detailed) university crest stays legible on photos and on the
 * black navbar. The wordmark is optional and inherits the surrounding text color.
 */
export function BrandMark({
  size = 32,
  wordmark = true,
  className,
  wordmarkClassName,
  accentClassName = "text-brand",
  priority = false,
}: {
  /** Height of each crest in pixels. */
  size?: number;
  wordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
  /** Color of "Football". Bright gold suits dark backgrounds; pass a deeper amber on light ones. */
  accentClassName?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span className="flex items-center gap-1.5 rounded-full bg-white/95 p-1 pr-1.5 pl-2 shadow-md shadow-black/20 ring-1 ring-black/5">
        <Image
          src="/University_of_Moratuwa_logo.png"
          alt="University of Moratuwa"
          width={Math.round(size * (250 / 266))}
          height={size}
          priority={priority}
          className="object-contain"
          style={{ height: size, width: "auto" }}
        />
        <span className="h-[60%] w-px self-center bg-black/15" style={{ height: size * 0.6 }} aria-hidden />
        <Image src="/logo.jpg" alt="Mora Football" width={size} height={size} priority={priority} className="rounded-full" />
      </span>
      {wordmark && (
        <span className={cn("text-sm font-semibold tracking-[0.2em] uppercase", wordmarkClassName)}>
          Mora <span className={accentClassName}>Football</span>
        </span>
      )}
    </span>
  );
}
