"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ErrorState } from "@/components/empty-state";
import { SelectField, TextAreaField, TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { teamTimeToIso, teamToday, toTeamInputs } from "@/lib/format";
import { useSaveMatch, useSaveTournament } from "@/lib/queries";
import type { Match, Tournament } from "@/lib/types";

// ---------- Tournament ----------

const tournamentSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    venue: z.string().trim(),
    startDate: z.string().min(1, "Pick a start date"),
    startTime: z.string().min(1, "Pick a start time"),
    endDate: z.string(),
    description: z.string().trim(),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, { message: "End date can't be before the start date", path: ["endDate"] });
type TournamentValues = z.infer<typeof tournamentSchema>;

/** Adds a tournament, or edits one when `tournament` is given (admins only). */
export function TournamentDialog({
  open,
  onOpenChange,
  tournament,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The tournament to edit. */
  tournament?: Tournament | null;
}) {
  const editing = Boolean(tournament);
  const save = useSaveTournament(tournament?.id);
  const { register, handleSubmit, formState, reset } = useForm<TournamentValues>({ resolver: zodResolver(tournamentSchema) });

  useEffect(() => {
    if (open) {
      if (tournament) {
        const start = toTeamInputs(tournament.startDate);
        reset({
          name: tournament.name,
          venue: tournament.venue ?? "",
          startDate: start.date,
          startTime: start.time,
          endDate: tournament.endDate ? toTeamInputs(tournament.endDate).date : "",
          description: tournament.description ?? "",
        });
      } else {
        reset({ name: "", venue: "", startDate: teamToday(), startTime: "08:00", endDate: "", description: "" });
      }
      save.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tournament]);

  const onSubmit = (v: TournamentValues) =>
    save.mutate(
      {
        name: v.name,
        venue: v.venue,
        description: v.description,
        startDate: teamTimeToIso(v.startDate, v.startTime),
        // A tournament runs until the end of its last day.
        endDate: v.endDate ? teamTimeToIso(v.endDate, "23:59") : null,
      },
      {
        onSuccess: (t) => {
          toast.success(editing ? `Updated ${t.name}` : `Added ${t.name}`);
          onOpenChange(false);
        },
      },
    );

  const e = formState.errors;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit tournament" : "Add tournament"}</DialogTitle>
          <DialogDescription>The countdown on the dashboard runs to the start date and time.</DialogDescription>
        </DialogHeader>
        <form id="tournament-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            {save.error && <ErrorState error={save.error} />}
            <TextField id="t-name" label="Name" error={e.name} {...register("name")} />
            <TextField id="t-venue" label="Venue" error={e.venue} {...register("venue")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField id="t-start" label="Start date" type="date" error={e.startDate} {...register("startDate")} />
              <TextField id="t-start-time" label="Start time" type="time" error={e.startTime} {...register("startTime")} />
              <TextField id="t-end" label="End date" type="date" error={e.endDate} description="Optional" {...register("endDate")} />
            </div>
            <TextAreaField id="t-desc" label="Description" rows={3} error={e.description} {...register("description")} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="tournament-form" disabled={save.isPending}>
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Add tournament"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Match ----------

const score = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{1,2}$/.test(v), "0–99");

const matchSchema = z
  .object({
    tournamentId: z.string(),
    opponent: z.string().trim().min(1, "Opponent is required"),
    date: z.string().min(1, "Pick a date"),
    time: z.string().min(1, "Pick a time"),
    scoreFor: score,
    scoreAgainst: score,
  })
  .refine((v) => (v.scoreFor === "") === (v.scoreAgainst === ""), { message: "Enter both scores, or neither", path: ["scoreAgainst"] });
type MatchValues = z.infer<typeof matchSchema>;

export function MatchDialog({
  open,
  onOpenChange,
  tournaments,
  defaultTournamentId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournaments: Tournament[];
  defaultTournamentId?: string;
  /** Called with the new match, e.g. to open its report when it has been played. */
  onCreated?: (match: Match) => void;
}) {
  const save = useSaveMatch();
  const { register, handleSubmit, formState, reset } = useForm<MatchValues>({ resolver: zodResolver(matchSchema) });

  useEffect(() => {
    if (open) {
      reset({ tournamentId: defaultTournamentId ?? "", opponent: "", date: teamToday(), time: "15:00", scoreFor: "", scoreAgainst: "" });
      save.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultTournamentId]);

  const onSubmit = (v: MatchValues) =>
    save.mutate(
      {
        tournamentId: v.tournamentId || null,
        opponent: v.opponent,
        date: teamTimeToIso(v.date, v.time),
        // The backend derives WIN/DRAW/LOSS from the score.
        scoreFor: v.scoreFor === "" ? null : Number(v.scoreFor),
        scoreAgainst: v.scoreAgainst === "" ? null : Number(v.scoreAgainst),
      },
      {
        onSuccess: (m) => {
          toast.success(`Logged match vs ${m.opponent}`);
          onOpenChange(false);
          onCreated?.(m);
        },
      },
    );

  const e = formState.errors;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log match</DialogTitle>
          <DialogDescription>Leave the score empty for a fixture that hasn&apos;t been played yet. With a score, you&apos;ll add the match report (players, cards, man of the match) next.</DialogDescription>
        </DialogHeader>
        <form id="match-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            {save.error && <ErrorState error={save.error} />}
            <SelectField id="m-tournament" label="Tournament" error={e.tournamentId} {...register("tournamentId")}>
              <option value="">Friendly (no tournament)</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </SelectField>
            <TextField id="m-opponent" label="Opponent" error={e.opponent} {...register("opponent")} />
            <div className="grid grid-cols-2 gap-4">
              <TextField id="m-date" label="Date" type="date" error={e.date} {...register("date")} />
              <TextField id="m-time" label="Kick-off" type="time" error={e.time} {...register("time")} />
              <TextField id="m-for" label="Our score" inputMode="numeric" error={e.scoreFor} {...register("scoreFor")} />
              <TextField id="m-against" label="Their score" inputMode="numeric" error={e.scoreAgainst} {...register("scoreAgainst")} />
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="match-form" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Log match"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
