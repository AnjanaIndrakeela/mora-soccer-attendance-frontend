"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { cn } from "cn";
import { z } from "zod";
import { ErrorState } from "@/components/empty-state";
import { TextField } from "@/components/form-fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useLogin } from "@/lib/queries";
import { AuthCard } from "../auth-card";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type Values = z.infer<typeof schema>;

/** Only allow same-site relative redirects. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const login = useLogin();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (values: Values) => login.mutate(values, { onSuccess: () => router.replace(next) });

  return (
    <AuthCard title="Welcome back" description="Log in to Mora Football">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {login.error && <ErrorState error={login.error} />}
          <TextField id="email" label="Email" type="email" autoComplete="email" error={formState.errors.email} {...register("email")} />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            error={formState.errors.password}
            {...register("password")}
          />
          <Link href="/forgot-password" className="-mt-3 self-end text-sm text-muted-foreground underline-offset-4 hover:underline">
            Forgot password?
          </Link>
          <div className="flex flex-col gap-2">
            <Button type="submit" size="lg" disabled={login.isPending}>
              {login.isPending ? "Logging in…" : "Log in"}
            </Button>
            <Link
              href={next === "/dashboard" ? "/register" : `/register?next=${encodeURIComponent(next)}`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-foreground/15 dark:border-input")}
            >
              Sign up
            </Link>
          </div>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
