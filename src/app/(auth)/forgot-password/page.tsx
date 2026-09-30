"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorState } from "@/components/empty-state";
import { TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useForgotPassword } from "@/lib/queries";
import { AuthCard } from "../auth-card";

const schema = z.object({ email: z.email("Enter a valid email") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  if (forgot.isSuccess) {
    return (
      <AuthCard title="Check your email">
        <div className="flex flex-col items-center gap-4 text-center text-sm text-muted-foreground">
          <MailCheck className="size-10 text-status-good" />
          <p>{forgot.data.message} The link expires in 45 minutes.</p>
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Back to log in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" description="We'll email you a link to reset it.">
      <form onSubmit={handleSubmit((v) => forgot.mutate(v))} noValidate>
        <FieldGroup>
          {forgot.error && <ErrorState error={forgot.error} />}
          <TextField id="email" label="Email" type="email" autoComplete="email" error={formState.errors.email} {...register("email")} />
          <Button type="submit" size="lg" disabled={forgot.isPending}>
            {forgot.isPending ? "Sending…" : "Send reset link"}
          </Button>
          <Link href="/login" className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
            Back to log in
          </Link>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
