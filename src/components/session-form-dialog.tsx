"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ErrorState } from "@/components/empty-state";
import { SelectField, TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { formatDate, SESSION_TYPE_LABELS, TEAM_TIMEZONE, teamTimeToIso, teamToday, toDateInput, toTeamInputs } from "@/lib/format";
import { type SessionInput, useSaveSession } from "@/lib/queries";
import type { Session, SessionType } from "@/lib/types";

const schema = z
  .object({
    date: z.string().min(1, "Pick a date"),
    type: z.enum(["PRACTICE", "FITNESS", "MATCH_PREP", "OTHER"]),
    startTime: z.string().min(1, "Pick a start time"),
    endTime: z.string().min(1, "Pick an end time"),
  })
  .refine((v) => v.endTime > v.startTime, { message: "End time must be after the start time", path: ["endTime"] });
type Values = z.infer<typeof schema>;

/** Creates a session, or edits one when `session` is given (admins only; finalized sessions can't be edited). */
export function SessionFormDialog({
  open,
  onOpenChange,
  onCreated,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the new session, e.g. to show its QR code right away. */
  onCreated?: (session: Session) => void;
  /** The session to edit. */
  session?: Session | null;
}) {
  const editing = Boolean(session);
  const save = useSaveSession(session?.id);
  const { register, handleSubmit, formState, reset } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset(
        session
          ? {
              date: toDateInput(session.date),
              type: session.type,
              startTime: toTeamInputs(session.startTime).time,
              endTime: toTeamInputs(session.endTime).time,
            }
          : { date: teamToday(), type: "PRACTICE", startTime: "16:30", endTime: "18:30" },
      );
      save.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session]);

  const onSubmit = (v: Values) => {
    const next: SessionInput = { date: v.date, type: v.type, startTime: teamTimeToIso(v.date, v.startTime), endTime: teamTimeToIso(v.date, v.endTime) };

    if (!session) {
      return save.mutate(next, {
        onSuccess: (s) => {
          toast.success(`${SESSION_TYPE_LABELS[s.type]} session created for ${formatDate(s.startTime)}`);
          onOpenChange(false);
          onCreated?.(s);
        },
      });
    }

    // Send only what changed: a new end time re-issues the QR code, so don't touch it needlessly.
    const changes: Partial<SessionInput> = {};
    if (next.date !== toDateInput(session.date)) changes.date = next.date;
    if (next.type !== session.type) changes.type = next.type;
    if (new Date(next.startTime).getTime() !== new Date(session.startTime).getTime()) changes.startTime = next.startTime;
    if (new Date(next.endTime).getTime() !== new Date(session.endTime).getTime()) changes.endTime = next.endTime;
    if (Object.keys(changes).length === 0) return onOpenChange(false);

    save.mutate(changes, {
      onSuccess: () => {
        toast.success(changes.endTime ? "Session updated. Share the new QR code: the old one no longer works." : "Session updated");
        onOpenChange(false);
      },
    });
  };

  const e = formState.errors;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit session" : "Create session"}</DialogTitle>
          <DialogDescription>
            Times are in the team&apos;s timezone ({TEAM_TIMEZONE}). Players can check in from 15 minutes before the start until 15 minutes after the end.
            {editing && " Changing the date or end time issues a new QR code; the old one stops working."}
          </DialogDescription>
        </DialogHeader>
        <form id="session-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            {save.error && <ErrorState error={save.error} />}
            <TextField id="date" label="Date" type="date" error={e.date} {...register("date")} />
            <SelectField id="type" label="Type" error={e.type} {...register("type")}>
              {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map((t) => (
                <option key={t} value={t}>
                  {SESSION_TYPE_LABELS[t]}
                </option>
              ))}
            </SelectField>
            <div className="grid grid-cols-2 gap-4">
              <TextField id="startTime" label="Start" type="time" error={e.startTime} {...register("startTime")} />
              <TextField id="endTime" label="End" type="time" error={e.endTime} {...register("endTime")} />
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="session-form" disabled={save.isPending}>
            {save.isPending ? (editing ? "Saving…" : "Creating…") : editing ? "Save changes" : "Create session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
