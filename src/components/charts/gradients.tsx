/**
 * Single-hue gradients for chart marks. Each fades a mark's own color into the card surface,
 * so identity stays with the hue and the fade follows the light/dark theme.
 * Render inside a Recharts chart (it accepts SVG <defs> as a child).
 */
export function fade(color: string, percent: number) {
  return `color-mix(in oklab, ${color} ${percent}%, var(--card))`;
}

export function LinearGradient({
  id,
  color,
  direction = "horizontal",
  from = 45,
  fromOpacity = 1,
  toOpacity = 1,
}: {
  id: string;
  color: string;
  /** horizontal: faded at the left, full at the right. vertical: full at the top, faded at the bottom. diagonal: full top-left. */
  direction?: "horizontal" | "vertical" | "diagonal";
  /** How much of the color is in the faded end (0–100). */
  from?: number;
  fromOpacity?: number;
  toOpacity?: number;
}) {
  const coords = {
    horizontal: { x1: 0, y1: 0, x2: 1, y2: 0 },
    vertical: { x1: 0, y1: 1, x2: 0, y2: 0 },
    diagonal: { x1: 1, y1: 1, x2: 0, y2: 0 },
  }[direction];

  return (
    <linearGradient id={id} {...coords}>
      <stop offset="0%" style={{ stopColor: fade(color, from), stopOpacity: fromOpacity }} />
      <stop offset="100%" style={{ stopColor: color, stopOpacity: toOpacity }} />
    </linearGradient>
  );
}

/** A `useId()` value made safe for SVG `url(#id)` references. */
export function svgId(reactId: string) {
  return reactId.replace(/[^a-zA-Z0-9_-]/g, "");
}
