"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { contactSchema } from "@/lib/validators";
import { submitContact, type ContactResult } from "@/app/contact/actions";
import type { z } from "zod";

type FormValues = z.infer<typeof contactSchema>;

const INQUIRIES: { value: FormValues["inquiry"]; label: string }[] = [
  { value: "general", label: "General question" },
  { value: "membership", label: "Membership" },
  { value: "expo", label: "Expo 2026" },
  { value: "directory", label: "Business directory" },
  { value: "partnership", label: "Partnership / sponsorship" },
  { value: "other", label: "Other" },
];

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ContactResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", inquiry: "general", message: "" },
  });

  function onSubmit(values: FormValues) {
    setResult(null);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, v ?? ""));
    startTransition(async () => {
      const res = await submitContact(fd);
      setResult(res);
      if (res.ok) form.reset();
    });
  }

  if (result?.ok) {
    return (
      <div className="text-center py-8">
        <div className="size-12 mx-auto rounded-full bg-[color:var(--color-teal-500)]/15 flex items-center justify-center">
          <CheckCircle2 size={24} className="text-[color:var(--color-teal-600)]" />
        </div>
        <h3 className="mt-5 font-display text-2xl">Message sent.</h3>
        <p className="mt-2 text-[color:var(--color-navy-700)] max-w-md mx-auto">
          Thanks for reaching out — we'll get back to you as soon as we can.
        </p>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-6 btn btn-outline text-sm"
        >
          Send another message
        </button>
      </div>
    );
  }

  const errors = form.formState.errors;
  const fieldErrors = !result?.ok && result?.fieldErrors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      {!result?.ok && result?.error && (
        <div className="flex gap-2.5 p-3 rounded-lg bg-red-50 text-red-900 border border-red-100 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {result.error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="field-label">Your name</span>
          <input className="field-input" {...form.register("name")} autoComplete="name" />
          <Err msg={errors.name?.message ?? fieldErrors?.name?.[0]} />
        </label>
        <label className="block">
          <span className="field-label">Email</span>
          <input className="field-input" type="email" {...form.register("email")} autoComplete="email" />
          <Err msg={errors.email?.message ?? fieldErrors?.email?.[0]} />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="field-label">Phone (optional)</span>
          <input className="field-input" {...form.register("phone")} autoComplete="tel" />
          <Err msg={errors.phone?.message ?? fieldErrors?.phone?.[0]} />
        </label>
        <label className="block">
          <span className="field-label">What's this about?</span>
          <select className="field-input" {...form.register("inquiry")}>
            {INQUIRIES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="field-label">Message</span>
        <textarea
          rows={6}
          className="field-input resize-y min-h-[140px]"
          placeholder="Tell us a bit about what you'd like to discuss…"
          {...form.register("message")}
        />
        <Err msg={errors.message?.message ?? fieldErrors?.message?.[0]} />
      </label>

      <button type="submit" disabled={pending} className="btn btn-primary mt-2 self-start">
        {pending ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Send message</>}
      </button>
    </form>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="block mt-1.5 text-xs text-red-700">{msg}</span>;
}
