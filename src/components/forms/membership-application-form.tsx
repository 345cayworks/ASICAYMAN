"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { membershipApplicationSchema } from "@/lib/validators";
import {
  applyForMembership,
  type MembershipApplicationResult,
} from "@/app/membership/apply/actions";
import type { z } from "zod";

type FormValues = z.infer<typeof membershipApplicationSchema>;

export function MembershipApplicationForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(membershipApplicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      whatsapp: "",
      churchAffiliation: "",
      membershipType: "INDIVIDUAL",
      reason: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    setFieldErrors({});
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));
    startTransition(async () => {
      const res: MembershipApplicationResult = await applyForMembership(fd);
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
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <label className="block">
        <span className="field-label">Full name</span>
        <input className="field-input" {...form.register("name")} autoComplete="name" />
        <Err msg={form.formState.errors.name?.message ?? fieldErrors.name?.[0]} />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="field-label">Email</span>
          <input className="field-input" type="email" {...form.register("email")} autoComplete="email" />
          <Err msg={form.formState.errors.email?.message ?? fieldErrors.email?.[0]} />
        </label>
        <label className="block">
          <span className="field-label">Phone</span>
          <input className="field-input" {...form.register("phone")} autoComplete="tel" />
          <Err msg={form.formState.errors.phone?.message ?? fieldErrors.phone?.[0]} />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="field-label">WhatsApp (optional)</span>
          <input className="field-input" {...form.register("whatsapp")} />
          <Err msg={form.formState.errors.whatsapp?.message ?? fieldErrors.whatsapp?.[0]} />
        </label>
        <label className="block">
          <span className="field-label">Membership type</span>
          <select className="field-input" {...form.register("membershipType")}>
            <option value="INDIVIDUAL">Individual / Professional</option>
            <option value="BUSINESS">Business owner</option>
            <option value="STUDENT">Student</option>
          </select>
          <Err msg={form.formState.errors.membershipType?.message ?? fieldErrors.membershipType?.[0]} />
        </label>
      </div>

      <label className="block">
        <span className="field-label">Home church / company</span>
        <input
          className="field-input"
          {...form.register("churchAffiliation")}
          placeholder="e.g. George Town SDA Church"
        />
        <Err
          msg={
            form.formState.errors.churchAffiliation?.message ??
            fieldErrors.churchAffiliation?.[0]
          }
        />
      </label>

      <label className="block">
        <span className="field-label">Why would you like to join ASI Cayman?</span>
        <textarea
          className="field-input min-h-[110px]"
          {...form.register("reason")}
          placeholder="Your background, profession or business, and how you'd like to contribute."
        />
        <Err msg={form.formState.errors.reason?.message ?? fieldErrors.reason?.[0]} />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="field-label">Password</span>
          <input
            className="field-input"
            type="password"
            {...form.register("password")}
            autoComplete="new-password"
          />
          <Err msg={form.formState.errors.password?.message ?? fieldErrors.password?.[0]} />
        </label>
        <label className="block">
          <span className="field-label">Confirm password</span>
          <input
            className="field-input"
            type="password"
            {...form.register("confirmPassword")}
            autoComplete="new-password"
          />
          <Err
            msg={
              form.formState.errors.confirmPassword?.message ??
              fieldErrors.confirmPassword?.[0]
            }
          />
        </label>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary mt-2">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Submitting application…
          </>
        ) : (
          "Submit membership application"
        )}
      </button>
      <p className="text-xs text-[color:var(--color-navy-600)] text-center">
        An ASI Cayman admin will review your application before activating full access.
      </p>
    </form>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="block mt-1.5 text-xs text-red-700">{msg}</span>;
}
