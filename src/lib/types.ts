export type Role = "ADMIN" | "PLAYER";
export type SessionType = "PRACTICE" | "FITNESS" | "MATCH_PREP" | "OTHER";
export type SessionStatus = "SCHEDULED" | "ACTIVE" | "ENDED" | "FINALIZED";
export type AttendanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "ABSENT";
export type MatchResult = "WIN" | "DRAW" | "LOSS";

export interface PlayerSummary {
  id: string;
  name: string;
  indexNo?: string;
  jerseyNumber: number | null;
  profilePicUrl: string | null;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  playerId: string | null;
  playerConfirmedAt: string | null;
  createdAt: string;
  player: PlayerSummary | null;
}

export interface AttendanceSummary {
  approved: number;
  total: number;
  percent: number | null;
}

export interface Player extends PlayerSummary {
  position: string | null;
  batch: string | null;
  department: string | null;
  faculty: string | null;
  isActive: boolean;
  joinedAt: string;
  // Only present for admins and the player themselves.
  birthday?: string | null;
  contactNo?: string | null;
  attendance: AttendanceSummary;
}

export interface PlayerDetail extends Player {
  recentAttendance: {
    id: string;
    status: AttendanceStatus;
    scannedAt: string | null;
    session: { id: string; date: string; type: SessionType; startTime: string };
  }[];
}

export interface PendingClaim {
  id: string;
  email: string;
  createdAt: string;
  player: PlayerSummary & { indexNo: string };
}

export interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: SessionType;
  status: SessionStatus;
  createdById: string | null;
  counts: Record<AttendanceStatus, number>;
  attendancePercent: number | null;
}

export interface SessionQr {
  url: string;
  pngDataUrl: string;
  svg: string;
  status: SessionStatus;
  startTime: string;
  endTime: string;
}

export interface AttendanceRecord {
  id: string;
  status: AttendanceStatus;
  scannedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: { id: string; email: string } | null;
  player: PlayerSummary & { batch: string | null; position: string | null };
}

export interface Match {
  id: string;
  tournamentId: string | null;
  opponent: string;
  date: string;
  result: MatchResult | null;
  scoreFor: number | null;
  scoreAgainst: number | null;
  tournament?: { id: string; name: string } | null;
}

export interface Tournament {
  id: string;
  name: string;
  venue: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  matches: Match[];
}

export interface DashboardStats {
  totalPlayers: number;
  totalSessions: number;
  totalMatches: number;
  nextTournament: Omit<Tournament, "matches" | "description"> | null;
  attendance: { APPROVED: number; REJECTED: number; ABSENT: number; total: number; percent: number | null };
}

export interface TrendPoint {
  date: string;
  sessionId: string | null;
  type: SessionType | null;
  approved: number;
  total: number;
  percent: number | null;
}

export interface GroupStat {
  key: string;
  approved: number;
  total: number;
  percent: number | null;
}

export interface PlayerStat extends AttendanceSummary {
  id: string;
  name: string;
  jerseyNumber: number | null;
  profilePicUrl: string | null;
  batch: string | null;
  position: string | null;
}

export interface ProgressStats {
  trend: TrendPoint[];
  byType: GroupStat[];
  byBatch: GroupStat[];
  byPosition: GroupStat[];
  perPlayer: PlayerStat[];
  atRisk: PlayerStat[];
  atRiskThreshold: number;
  streaks: { playerId: string; name: string; current: number; longest: number }[];
  matchRecord: { WIN: number; DRAW: number; LOSS: number; goalsFor: number; goalsAgainst: number };
}
