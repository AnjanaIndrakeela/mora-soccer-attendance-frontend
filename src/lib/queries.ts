"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api, qs } from "./api";
import type {
  AttendanceRecord,
  AttendanceStatus,
  DashboardStats,
  Match,
  MatchReport,
  PendingClaim,
  Player,
  PlayerDetail,
  PointsRow,
  PointsRules,
  ProgressStats,
  Session,
  SessionQr,
  SessionStatus,
  Tournament,
  TrendPoint,
  User,
} from "./types";

export const keys = {
  me: ["me"] as const,
  players: ["players"] as const,
  pendingClaims: ["pending-claims"] as const,
  sessions: ["sessions"] as const,
  tournaments: ["tournaments"] as const,
  matches: ["matches"] as const,
  stats: ["stats"] as const,
};

/** Invalidates several query families after a mutation. */
function useInvalidate() {
  const client = useQueryClient();
  return (...families: QueryKey[]) => Promise.all(families.map((queryKey) => client.invalidateQueries({ queryKey })));
}

// ---------- Auth ----------

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api<{ user: User }>("/auth/me").then((r) => r.user),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) => api<{ user: User }>("/auth/login", { body }),
    onSuccess: ({ user }) => {
      client.clear();
      client.setQueryData(keys.me, user);
    },
  });
}

export function useRegister() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string; indexNo: string }) => api<{ user: User }>("/auth/register", { body }),
    onSuccess: ({ user }) => {
      client.clear();
      client.setQueryData(keys.me, user);
    },
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSettled: () => client.clear(),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: { email: string }) => api<{ message: string }>("/auth/forgot-password", { body }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (body: { token: string; password: string }) => api<{ message: string }>("/auth/reset-password", { body }),
  });
}

// ---------- Players ----------

export interface PlayerListParams {
  sort?: "attendance" | "points" | "name" | "number";
  limit?: number;
  includeInactive?: boolean;
  search?: string;
}

export function usePlayers(params: PlayerListParams = {}) {
  return useQuery({
    queryKey: [...keys.players, "list", params],
    queryFn: () => api<{ items: Player[]; total: number }>(`/players${qs({ ...params })}`),
  });
}

export function usePlayer(id: string) {
  return useQuery({ queryKey: [...keys.players, id], queryFn: () => api<PlayerDetail>(`/players/${id}`) });
}

export function useSavePlayer(id?: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (form: FormData) => api<Player>(id ? `/players/${id}` : "/players", { method: id ? "PATCH" : "POST", body: form }),
    onSuccess: () => invalidate(keys.players, keys.stats, keys.me),
  });
}

export function useDeactivatePlayer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/players/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(keys.players, keys.stats),
  });
}

export function usePendingClaims(enabled = true) {
  return useQuery({ queryKey: keys.pendingClaims, queryFn: () => api<PendingClaim[]>("/users/pending"), enabled });
}

export function useResolveClaim() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ userId, approve }: { userId: string; approve: boolean }) =>
      approve ? api<void>(`/users/${userId}/confirm`, { method: "POST" }) : api<void>(`/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => invalidate(keys.pendingClaims),
  });
}

// ---------- Sessions & attendance ----------

export function useSessions(params: { limit?: number; status?: SessionStatus } = {}) {
  return useQuery({
    queryKey: [...keys.sessions, "list", params],
    queryFn: () => api<Session[]>(`/sessions${qs({ ...params })}`),
    // Session status depends on the clock (scan window), so keep it fresh.
    refetchInterval: 60 * 1000,
  });
}

export interface SessionInput {
  date: string;
  startTime: string;
  endTime: string;
  type: Session["type"];
}

export function useSaveSession(id?: string) {
  const invalidate = useInvalidate();
  return useMutation({
    // Edits may send only the changed fields.
    mutationFn: (body: SessionInput | Partial<SessionInput>) =>
      api<Session>(id ? `/sessions/${id}` : "/sessions", { method: id ? "PATCH" : "POST", body: { ...body } }),
    // A new date moves the session in the trend and progress stats.
    onSuccess: () => (id ? invalidate(keys.sessions, keys.stats, keys.players) : invalidate(keys.sessions)),
  });
}

export function useDeleteSession() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(keys.sessions, keys.stats, keys.players),
  });
}

export function useSessionQr(id: string | null) {
  return useQuery({
    queryKey: [...keys.sessions, id, "qr"],
    queryFn: () => api<SessionQr>(`/sessions/${id}/qr`),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export function useSessionAttendance(id: string) {
  return useQuery({
    queryKey: [...keys.sessions, id, "attendance"],
    queryFn: () => api<{ session: Session; records: AttendanceRecord[] }>(`/sessions/${id}/attendance`),
    // Scans keep arriving while the session is live.
    refetchInterval: 15 * 1000,
  });
}

/** End, approve-all and finalize all refresh the same data. */
export function useSessionAction(action: "end" | "approve-all" | "finalize") {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<unknown>(`/sessions/${id}/${action}`, { method: "POST" }),
    onSuccess: () => invalidate(keys.sessions, keys.players, keys.stats),
  });
}

export function useReviewAttendance() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ recordId, status }: { recordId: string; status: Exclude<AttendanceStatus, "PENDING"> }) =>
      api(`/attendance/${recordId}`, { method: "PATCH", body: { status } }),
    onSuccess: () => invalidate(keys.sessions, keys.players, keys.stats),
  });
}

export function useSetPlayerAttendance(sessionId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: { playerId: string; status: Exclude<AttendanceStatus, "PENDING"> }) =>
      api(`/sessions/${sessionId}/attendance`, { body }),
    onSuccess: () => invalidate(keys.sessions, keys.players, keys.stats),
  });
}

export interface CheckInPreview {
  session: Pick<Session, "id" | "type" | "status" | "startTime" | "endTime">;
  player: { name: string } | null;
  record: { id: string; status: AttendanceStatus; scannedAt: string | null } | null;
  canCheckIn: boolean;
  reason: string | null;
}

/** Validates a scanned QR code and shows the session before the player confirms. */
export function useCheckInPreview(sessionId: string, token: string | null) {
  return useQuery({
    queryKey: [...keys.sessions, sessionId, "check-in", token],
    queryFn: () => api<CheckInPreview>(`/attend/${sessionId}${qs({ t: token })}`),
    enabled: Boolean(token),
  });
}

export function useAttend() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: { sessionId: string; token: string }) =>
      api<{ record: { id: string; status: AttendanceStatus; scannedAt: string }; session: Pick<Session, "id" | "type" | "startTime" | "endTime">; player: { name: string } }>(
        "/attend",
        { body },
      ),
    onSuccess: () => invalidate(keys.sessions),
  });
}

// ---------- Tournaments & matches ----------

export function useTournaments(upcoming?: boolean) {
  return useQuery({
    queryKey: [...keys.tournaments, { upcoming }],
    queryFn: () => api<Tournament[]>(`/tournaments${qs({ upcoming })}`),
  });
}

export interface TournamentInput {
  name: string;
  venue?: string;
  startDate: string;
  endDate?: string | null;
  description?: string;
}

export function useSaveTournament(id?: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: TournamentInput) =>
      api<Tournament>(id ? `/tournaments/${id}` : "/tournaments", { method: id ? "PATCH" : "POST", body: { ...body } }),
    onSuccess: () => invalidate(keys.tournaments, keys.stats),
  });
}

export function useDeleteTournament() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/tournaments/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(keys.tournaments, keys.matches, keys.stats),
  });
}

export function useFriendlies() {
  return useQuery({ queryKey: [...keys.matches, "friendlies"], queryFn: () => api<Match[]>("/matches?friendlies=true") });
}

export interface MatchInput {
  tournamentId?: string | null;
  opponent: string;
  date: string;
  result?: Match["result"];
  scoreFor?: number | null;
  scoreAgainst?: number | null;
}

export function useSaveMatch(id?: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ tournamentId, ...body }: MatchInput) =>
      id
        ? api<Match>(`/matches/${id}`, { method: "PATCH", body: { ...body } })
        : tournamentId
          ? api<Match>(`/tournaments/${tournamentId}/matches`, { body: { ...body } })
          : api<Match>("/matches", { body: { ...body } }),
    onSuccess: () => invalidate(keys.tournaments, keys.matches, keys.stats),
  });
}

export function useMatchReport(id: string | null) {
  return useQuery({
    queryKey: [...keys.matches, id, "report"],
    queryFn: () => api<MatchReport>(`/matches/${id}`),
    enabled: Boolean(id),
  });
}

export interface MatchReportInput {
  appearances: { playerId: string; yellowCards: number; redCards: number }[];
  manOfTheMatchId: string | null;
}

/** Saving a report changes points, so refresh matches, players and stats. */
export function useSaveMatchReport(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: MatchReportInput) => api<MatchReport>(`/matches/${id}/report`, { method: "PUT", body: { ...body } }),
    onSuccess: () => invalidate(keys.matches, keys.tournaments, keys.players, keys.stats),
  });
}

export function useDeleteMatch() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/matches/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(keys.tournaments, keys.matches, keys.stats, keys.players),
  });
}

// ---------- Stats ----------

export function useDashboardStats() {
  return useQuery({ queryKey: [...keys.stats, "dashboard"], queryFn: () => api<DashboardStats>("/stats/dashboard") });
}

export function useAttendanceTrend(params: { groupBy?: "session" | "week"; limit?: number } = {}) {
  return useQuery({
    queryKey: [...keys.stats, "trend", params],
    queryFn: () => api<TrendPoint[]>(`/stats/attendance-trend${qs({ ...params })}`),
  });
}

export function usePointsTable() {
  return useQuery({
    queryKey: [...keys.stats, "points"],
    queryFn: () => api<{ rules: PointsRules; players: PointsRow[] }>("/stats/points"),
  });
}

export function useProgress(params: { from?: string; to?: string; atRiskThreshold?: number }) {
  return useQuery({
    queryKey: [...keys.stats, "progress", params],
    queryFn: () => api<ProgressStats>(`/stats/progress${qs({ ...params })}`),
  });
}
