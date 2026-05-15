"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { signUpSchema } from "@/lib/validators";
import { signUpAction, type SignUpResult } from "@/app/auth/signup/actions";
import type { z } from "zod";

type FormValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    setFieldErrors({});
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, v));
    startTransition(async () => {
      const res: SignUpResult = await signUpAction(fd);
      if (!res.ok) {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      {error && (
        <div className="flex gap-2.5 p-3 rounded-lg bg-red-50 text-red-900 border border-red-100 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
        </div>
      )}

      <label className="block">
        <span className="field-label">Full name</span>
        <input className="field-input" {...form.register("name")} autoComplete="name" />
        <Err msg={form.formState.errors.name?.message ?? fieldErrors.name?.[0]} />
      </label>

      <label className="block">
        <span className="field-label">Email</span>
        <input className="field-input" type="email" {...form.register("email")} autoComplete="email" />
        <Err msg={form.formState.errors.email?.message ?? fieldErrors.email?.[0]} />
      </label>

      <label className="block">
        <span className="field-label">Phone (optional)</span>
        <input className="field-input" {...form.register("phone")} autoComplete="tel" />
        <Err msg={form.formState.errors.phone?.message ?? fieldErrors.phone?.[0]} />
      </label>

      <label className="block">
        <span className="field-label">Password</span>
        <input className="field-input" type="password" {...form.register("password")} autoComplete="new-password" />
        <Err msg={form.formState.errors.password?.message ?? fieldErrors.password?.[0]} />
      </label>

      <label className="block">
        <span className="field-label">Confirm password</span>
        <input className="field-input" type="password" {...form.register("confirmPassword")} autoComplete="new-password" />
        <Err msg={form.formState.errors.confirmPassword?.message ?? fieldErrors.confirmPassword?.[0]} />
      </label>

      <button type="submit" disabled={pending} className="btn btn-primary mt-2">
        {pending ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : "Create account"}
      </button>
    </form>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="block mt-1.5 text-xs text-red-700">{msg}</span>;
}
