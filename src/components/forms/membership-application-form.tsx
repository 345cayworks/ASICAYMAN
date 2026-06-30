"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { membershipApplicationSchema } from "@/lib/validators";
import { MEMBERSHIP_CATEGORIES } from "@/lib/membership";
import {
  applyForMembership,
  type MembershipApplicationResult,
} from "@/app/membership/apply/actions";
import type { z } from "zod";

type FormValues = z.infer<typeof membershipApplicationSchema>;

const COMMITMENT_TEXT =
  "Having read the purpose, objectives, and membership requirements of the " +
  "Adventist Business Community (ABC) and recognizing that my/our business " +
  "or profession is a ministry, I/we desire and pledge to uphold the " +
  "standards and goals of the Adventist Business Community. In witness " +
  "thereto, I/we am/are committed to the Adventist Business Community (ABC).";

export function MembershipApplicationForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(membershipApplicationSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      businessOrProfession: "",
      churchAffiliation: "",
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
        <span className="field-label">Name *</span>
        <input className="field-input" {...form.register("name")} autoComplete="name" />
        <Err msg={form.formState.errors.name?.message ?? fieldErrors.name?.[0]} />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="field-label">Phone # *</span>
          <input className="field-input" {...form.register("phone")} autoComplete="tel" />
          <Err msg={form.formState.errors.phone?.message ?? fieldErrors.phone?.[0]} />
        </label>
        <label className="block">
          <span className="field-label">Email *</span>
          <input className="field-input" type="email" {...form.register("email")} autoComplete="email" />
          <Err msg={form.formState.errors.email?.message ?? fieldErrors.email?.[0]} />
        </label>
      </div>

      <label className="block">
        <span className="field-label">Name of business or profession *</span>
        <input className="field-input" {...form.register("businessOrProfession")} />
        <Err
          msg={
            form.formState.errors.businessOrProfession?.message ??
            fieldErrors.businessOrProfession?.[0]
          }
        />
      </label>

      <label className="block">
        <span className="field-label">Name of church *</span>
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

      <fieldset className="block">
        <span className="field-label">Category of membership *</span>
        <div className="mt-2 grid gap-2">
          {MEMBERSHIP_CATEGORIES.map((c) => (
            <label
              key={c.value}
              className="flex items-center gap-3 rounded-lg border border-[color:var(--color-navy-100)] px-4 py-3 cursor-pointer hover:border-[color:var(--color-navy-300)]"
            >
              <input
                type="radio"
                value={c.value}
                {...form.register("membershipCategory")}
                className="accent-[color:var(--color-navy-900)]"
              />
              <span className="text-sm flex-1">{c.label}</span>
            </label>
          ))}
        </div>
        <Err
          msg={
            form.formState.errors.membershipCategory?.message ??
            fieldErrors.membershipCategory?.[0]
          }
        />
      </fieldset>

      <fieldset className="block rounded-lg bg-[color:var(--color-cream)] p-4">
        <span className="field-label">Commitment *</span>
        <p className="mt-1 text-sm text-[color:var(--color-navy-700)] leading-relaxed">
          {COMMITMENT_TEXT}
        </p>
        <div className="mt-3 flex gap-5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              value="YES"
              {...form.register("commitment")}
              className="accent-[color:var(--color-navy-900)]"
            />
            Yes, I/we am/are committed to the Adventist Business Community (ABC)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[color:var(--color-navy-600)]">
            <input
              type="radio"
              value="NO"
              {...form.register("commitment")}
              className="accent-[color:var(--color-navy-900)]"
            />
            No
          </label>
        </div>
        <Err
          msg={form.formState.errors.commitment?.message ?? fieldErrors.commitment?.[0]}
        />
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="field-label">Create a password *</span>
          <input
            className="field-input"
            type="password"
            {...form.register("password")}
            autoComplete="new-password"
          />
          <Err msg={form.formState.errors.password?.message ?? fieldErrors.password?.[0]} />
        </label>
        <label className="block">
          <span className="field-label">Confirm password *</span>
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
        An admin will review your application before activating full access.
      </p>
    </form>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="block mt-1.5 text-xs text-red-700">{msg}</span>;
}
