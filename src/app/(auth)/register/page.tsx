"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorState } from "@/components/empty-state";
import { TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useRegister } from "@/lib/queries";
import { AuthCard } from "../auth-card";

const schema = z
  .object({
    indexNo: z.string().trim().min(1, "Index number is required"),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
type Values = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
  const registerUser = useRegister();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = ({ indexNo, email, password }: Values) =>
    registerUser.mutate({ indexNo, email, password }, { onSuccess: () => router.replace(next) });

  return (
    <AuthCard title="Create your account" description="Use the index number your admin added you with.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {registerUser.error && <ErrorState error={registerUser.error} />}
          <TextField
            id="indexNo"
            label="Index number"
            autoComplete="off"
            placeholder="e.g. 220123A"
            error={formState.errors.indexNo}
            {...register("indexNo")}
          />
          <TextField id="email" label="Email" type="email" autoComplete="email" error={formState.errors.email} {...register("email")} />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            error={formState.errors.password}
            {...register("password")}
          />
          <TextField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={formState.errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <Button type="submit" size="lg" disabled={registerUser.isPending}>
            {registerUser.isPending ? "Creating account…" : "Sign up"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
