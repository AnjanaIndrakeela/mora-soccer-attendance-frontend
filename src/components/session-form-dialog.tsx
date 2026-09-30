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
import { formatDate, SESSION_TYPE_LABELS, TEAM_TIMEZONE, teamTimeToIso, teamToday } from "@/lib/format";
import { useSaveSession } from "@/lib/queries";
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

export function SessionFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the new session, e.g. to show its QR code right away. */
  onCreated?: (session: Session) => void;
}) {
  const save = useSaveSession();
  const { register, handleSubmit, formState, reset } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({ date: teamToday(), type: "PRACTICE", startTime: "16:30", endTime: "18:30" });
      save.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (v: Values) =>
    save.mutate(
      { date: v.date, type: v.type, startTime: teamTimeToIso(v.date, v.startTime), endTime: teamTimeToIso(v.date, v.endTime) },
      {
        onSuccess: (s) => {
          toast.success(`${SESSION_TYPE_LABELS[s.type]} session created for ${formatDate(s.startTime)}`);
          onOpenChange(false);
          onCreated?.(s);
        },
      },
    );

  const e = formState.errors;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create session</DialogTitle>
          <DialogDescription>
            Times are in the team&apos;s timezone ({TEAM_TIMEZONE}). Players can check in from 15 minutes before the start until 15 minutes after the end.
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
            {save.isPending ? "Creating…" : "Create session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
