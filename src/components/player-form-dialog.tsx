"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ErrorState } from "@/components/empty-state";
import { SelectField, TextField } from "@/components/form-fields";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { toDateInput } from "@/lib/format";
import { useSavePlayer } from "@/lib/queries";
import type { Player } from "@/lib/types";

const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward"];
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  indexNo: z.string().trim().min(1, "Index number is required"),
  jerseyNumber: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 999), "Enter a number from 0 to 999"),
  position: z.string(),
  birthday: z.string(),
  batch: z.string().trim(),
  department: z.string().trim(),
  faculty: z.string().trim(),
  contactNo: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[+\d][\d\s-]{6,}$/.test(v), "Enter a valid phone number"),
});
type Values = z.infer<typeof schema>;

function defaults(player?: Player): Values {
  return {
    name: player?.name ?? "",
    indexNo: player?.indexNo ?? "",
    jerseyNumber: player?.jerseyNumber?.toString() ?? "",
    position: player?.position ?? "",
    birthday: toDateInput(player?.birthday),
    batch: player?.batch ?? "",
    department: player?.department ?? "",
    faculty: player?.faculty ?? "",
    contactNo: player?.contactNo ?? "",
  };
}

export function PlayerFormDialog({ open, onOpenChange, player }: { open: boolean; onOpenChange: (open: boolean) => void; player?: Player }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        {/* Mounted only while open, so form state starts fresh every time. */}
        {open && <PlayerForm player={player} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PlayerForm({ player, onDone }: { player?: Player; onDone: () => void }) {
  const save = useSavePlayer(player?.id);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults(player) });
  const fileInput = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<{ file: File; preview: string } | null>(null);
  const [removePic, setRemovePic] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Release the preview URL when it is replaced or the form closes.
  useEffect(() => () => {
    if (upload) URL.revokeObjectURL(upload.preview);
  }, [upload]);

  const pickFile = (f: File | undefined) => {
    setFileError(null);
    if (!f) return;
    if (!TYPES.includes(f.type)) return setFileError("Use a JPEG, PNG or WebP image.");
    if (f.size > MAX_BYTES) return setFileError("Images must be 2 MB or smaller.");
    setUpload({ file: f, preview: URL.createObjectURL(f) });
    setRemovePic(false);
  };

  const onSubmit = (values: Values) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.append(key, value);
    if (upload) form.append("profilePic", upload.file);
    if (removePic && !upload) form.append("removeProfilePic", "true");
    save.mutate(form, {
      onSuccess: (saved) => {
        toast.success(player ? `Saved ${saved.name}` : `Added ${saved.name} to the roster`);
        onDone();
      },
    });
  };

  const currentPic = upload?.preview ?? (removePic ? null : (player?.profilePicUrl ?? null));
  const e = formState.errors;

  return (
    <>
        <DialogHeader>
          <DialogTitle>{player ? "Edit player" : "Add player"}</DialogTitle>
          <DialogDescription>
            {player ? "Update this player's roster details." : "Players can sign up with their index number once they're on the roster."}
          </DialogDescription>
        </DialogHeader>

        <form id="player-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            {save.error && <ErrorState error={save.error} />}

            <div className="flex items-center gap-4">
              <PlayerAvatar player={{ name: player?.name ?? "?", profilePicUrl: currentPic }} className="size-16" />
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                    <ImagePlus />
                    {currentPic ? "Change photo" : "Upload photo"}
                  </Button>
                  {currentPic && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUpload(null);
                        setRemovePic(true);
                      }}
                    >
                      <X />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{fileError ?? "JPEG, PNG or WebP, up to 2 MB."}</p>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept={TYPES.join(",")}
                className="hidden"
                onChange={(ev) => {
                  pickFile(ev.target.files?.[0]);
                  ev.target.value = "";
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="name" label="Full name" error={e.name} {...register("name")} className="sm:col-span-2" />
              <TextField id="indexNo" label="Index number" error={e.indexNo} {...register("indexNo")} />
              <TextField id="jerseyNumber" label="Jersey number" inputMode="numeric" error={e.jerseyNumber} {...register("jerseyNumber")} />
              <SelectField id="position" label="Position" error={e.position} {...register("position")}>
                <option value="">Not set</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </SelectField>
              <TextField id="birthday" label="Birthday" type="date" error={e.birthday} {...register("birthday")} />
              <TextField id="batch" label="Batch" placeholder="e.g. 22" error={e.batch} {...register("batch")} />
              <TextField id="contactNo" label="Contact number" type="tel" error={e.contactNo} {...register("contactNo")} />
              <TextField id="faculty" label="Faculty" error={e.faculty} {...register("faculty")} />
              <TextField id="department" label="Department" error={e.department} {...register("department")} />
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onDone} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="player-form" disabled={save.isPending}>
            {save.isPending ? "Saving…" : player ? "Save changes" : "Add player"}
          </Button>
        </DialogFooter>
    </>
  );
}
