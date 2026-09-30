"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorState } from "@/components/empty-state";
import { TextField } from "@/components/form-fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useResetPassword } from "@/lib/queries";
import { AuthCard } from "../auth-card";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
type Values = z.infer<typeof schema>;

function ResetForm() {
  const token = useSearchParams().get("token");
  const reset = useResetPassword();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <AuthCard title="Invalid link" description="This reset link is missing its token.">
        <Link href="/forgot-password" className={buttonVariants({ className: "w-full", size: "lg" })}>
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  if (reset.isSuccess) {
    return (
      <AuthCard title="Password updated">
        <div className="flex flex-col items-center gap-4 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="size-10 text-status-good" />
          <p>{reset.data.message}</p>
          <Link href="/login" className={buttonVariants({ className: "w-full", size: "lg" })}>
            Log in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={handleSubmit(({ password }) => reset.mutate({ token, password }))} noValidate>
        <FieldGroup>
          {reset.error && <ErrorState error={reset.error} />}
          <TextField
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            error={formState.errors.password}
            {...register("password")}
          />
          <TextField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={formState.errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <Button type="submit" size="lg" disabled={reset.isPending}>
            {reset.isPending ? "Saving…" : "Reset password"}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
