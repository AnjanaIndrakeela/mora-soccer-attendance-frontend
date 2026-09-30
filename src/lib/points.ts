/** Points per match event. Mirrors the backend's POINTS (src/services/points.service.ts); used for live previews. */
export const POINTS = {
  appearance: 3,
  manOfTheMatch: 7,
  yellowCard: -1,
  redCard: -2,
} as const;

export function matchPoints(e: { played: boolean; manOfTheMatch: boolean; yellowCards: number; redCards: number }) {
  if (!e.played) return 0;
  return POINTS.appearance + (e.manOfTheMatch ? POINTS.manOfTheMatch : 0) + e.yellowCards * POINTS.yellowCard + e.redCards * POINTS.redCard;
}

export const formatPoints = (n: number) => (n > 0 ? `+${n}` : String(n));

export const POINTS_RULES = [
  { label: "Played a match", value: POINTS.appearance },
  { label: "Man of the match", value: POINTS.manOfTheMatch },
  { label: "Yellow card", value: POINTS.yellowCard },
  { label: "Red card", value: POINTS.redCard },
];
