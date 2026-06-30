"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Upload, Loader2 } from "lucide-react";
import { expoRegistrationSchema, type ExpoRegistrationInput } from "@/lib/validators";
import { registerForExpo, type ExpoRegistrationResult } from "@/app/expo/register/actions";
import { SITE } from "@/lib/utils";

const CATEGORIES = [
  "Health & Wellness",
  "Financial Services",
  "Professional Services",
  "Construction & Trades",
  "Technology",
  "Food & Hospitality",
  "Retail",
  "Education",
  "Media & Creative",
  "Real Estate",
  "Automotive",
  "Beauty & Personal Care",
  "Other",
];

const EARLY_BIRD_END = new Date("2026-05-31T23:59:59-05:00");

export function ExpoRegistrationForm({ defaultEmail }: { defaultEmail?: string }) {
  const [pending, startTransition] = useTransition();
  const [serverResult, setServerResult] = useState<ExpoRegistrationResult | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);

  const form = useForm<ExpoRegistrationInput>({
    resolver: zodResolver(expoRegistrationSchema),
    defaultValues: {
      fullName: "",
      businessName: "",
      email: defaultEmail ?? "",
      phone: "",
      businessCategory: "",
      isAsiMember: false,
      needsBooth: true,
      wantsVideoSubmission: false,
      promoVideoUrl: "",
      wantsInterview: false,
    },
  });

  const isMember = form.watch("isAsiMember");
  const earlyBirdActive = Date.now() <= EARLY_BIRD_END.getTime();
  const previewPrice = isMember || earlyBirdActive ? 100 : 150;
  const previewReason = isMember ? "ASI member" : earlyBirdActive ? "Early-bird pricing (before May 31)" : "Regular pricing";

  function onSubmit(values: ExpoRegistrationInput) {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v ?? "")));
    if (receipt) fd.append("receipt", receipt);

    startTransition(async () => {
      const result = await registerForExpo(fd);
      setServerResult(result);
      if (result.ok) {
        // scroll to top of confirmation
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (serverResult?.ok) {
    return (
      <SuccessConfirmation
        amount={serverResult.amount}
        reason={serverResult.reason}
        receiptUploaded={serverResult.receiptUploaded}
      />
    );
  }

  const errors = form.formState.errors;
  const serverFieldErrors = !serverResult?.ok && serverResult?.fieldErrors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
      {!serverResult?.ok && serverResult?.error && (
        <div className="flex gap-3 p-4 rounded-lg bg-red-50 text-red-900 border border-red-100">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{serverResult.error}</p>
        </div>
      )}

      <Fieldset legend="Your details">
        <Row>
          <Field label="Full name" error={errors.fullName?.message ?? serverFieldErrors?.fullName?.[0]}>
            <input className="field-input" {...form.register("fullName")} />
          </Field>
          <Field label="Email" error={errors.email?.message ?? serverFieldErrors?.email?.[0]}>
            <input className="field-input" type="email" {...form.register("email")} />
          </Field>
        </Row>
        <Row>
          <Field label="Phone / WhatsApp" error={errors.phone?.message ?? serverFieldErrors?.phone?.[0]}>
            <input className="field-input" {...form.register("phone")} placeholder="+1 345 …" />
          </Field>
          <Field label="Business name" error={errors.businessName?.message ?? serverFieldErrors?.businessName?.[0]}>
            <input className="field-input" {...form.register("businessName")} />
          </Field>
        </Row>
        <Field label="Business category" error={errors.businessCategory?.message ?? serverFieldErrors?.businessCategory?.[0]}>
          <select className="field-input" {...form.register("businessCategory")}>
            <option value="">Select a category…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </Fieldset>

      <Fieldset legend="Booth & promotion">
        <Toggle label="I'm a current ASI Cayman member" {...form.register("isAsiMember")} />
        <Toggle label="I need a booth at the expo" {...form.register("needsBooth")} />
        <Toggle label="I'd like to submit a 2-minute promotional video" {...form.register("wantsVideoSubmission")} />
        <Field label="Promo video link (optional)" hint="YouTube, Vimeo, or Drive link. You can also send by WhatsApp after registering." error={errors.promoVideoUrl?.message}>
          <input className="field-input" {...form.register("promoVideoUrl")} placeholder="https://…" />
        </Field>
        <Toggle label="I'm interested in an in-studio promotional interview" {...form.register("wantsInterview")} />
      </Fieldset>

      <Fieldset legend="Payment">
        <div className="rounded-xl bg-[color:var(--color-cream)]/60 border border-[color:var(--color-navy-100)] p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wider text-[color:var(--color-navy-600)]">Your registration total</p>
              <p className="mt-1 font-display text-3xl text-[color:var(--color-navy-900)]">${previewPrice}</p>
              <p className="text-xs text-[color:var(--color-navy-700)]">{previewReason}</p>
            </div>
            <p className="text-xs text-[color:var(--color-navy-600)] max-w-xs">
              The final amount is calculated and locked when you submit. ASI member status is verified by the admin team.
            </p>
          </div>
        </div>

        <div className="text-sm text-[color:var(--color-navy-700)] leading-relaxed space-y-2 mt-2">
          <p className="font-medium text-[color:var(--color-navy-900)]">How to pay</p>
          <p>Pay at RBC to <strong>{SITE.rbcAccount.name}</strong>, account <strong>#{SITE.rbcAccount.number}</strong>.</p>
          <p>Upload your receipt below, or send it to{" "}
            <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>.
          </p>
        </div>

        <ReceiptUploader file={receipt} onChange={setReceipt} />
      </Fieldset>

      <button
        type="submit"
        disabled={pending}
        className="btn btn-gold w-full text-base py-3 disabled:opacity-60"
      >
        {pending ? (<><Loader2 size={18} className="animate-spin" /> Submitting…</>) : "Submit registration"}
      </button>
      <p className="text-xs text-[color:var(--color-navy-600)] text-center">
        By submitting you agree to be contacted about Expo 2026 booth details and payment confirmation.
      </p>
    </form>
  );
}

// -----------------------------------------------------------------
function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 p-5 md:p-6 rounded-xl border border-[color:var(--color-navy-100)] bg-white">
      <legend className="px-2 -ml-2 section-eyebrow">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label, error, hint, children,
}: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="block mt-1.5 text-xs text-[color:var(--color-navy-600)]">{hint}</span>}
      {error && <span className="block mt-1.5 text-xs text-red-700">{error}</span>}
    </label>
  );
}

const Toggle = function Toggle({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-start gap-3 p-3 -mx-1 rounded-lg hover:bg-[color:var(--color-cream)]/40 cursor-pointer">
      <input type="checkbox" {...rest} className="mt-1 size-4 accent-[color:var(--color-navy-800)]" />
      <span className="text-sm text-[color:var(--color-navy-900)]">{label}</span>
    </label>
  );
};

function ReceiptUploader({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  return (
    <label className="block mt-2 cursor-pointer">
      <span className="field-label">Receipt upload (optional)</span>
      <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-[color:var(--color-navy-200)] hover:border-[color:var(--color-navy-800)] transition-colors bg-white">
        <Upload size={18} className="text-[color:var(--color-navy-600)] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[color:var(--color-navy-900)]">
            {file ? file.name : "Click to attach your RBC receipt"}
          </p>
          <p className="text-xs text-[color:var(--color-navy-600)]">JPG, PNG, HEIC, WEBP, or PDF · max 8 MB</p>
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onChange(null); }}
            className="text-xs underline text-[color:var(--color-navy-700)]"
          >
            Remove
          </button>
        )}
      </div>
      <input
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/heic,image/webp,application/pdf"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function SuccessConfirmation({
  amount, reason, receiptUploaded,
}: { amount: number; reason: string; receiptUploaded: boolean }) {
  return (
    <div className="grid gap-6">
      <div className="card p-8 md:p-12 text-center">
        <div className="size-14 mx-auto rounded-full bg-[color:var(--color-teal-500)]/15 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-[color:var(--color-teal-600)]" />
        </div>
        <h2 className="mt-6 font-display text-3xl">You're registered.</h2>
        <p className="mt-3 text-[color:var(--color-navy-700)] max-w-md mx-auto">
          We've recorded your registration for the ASI Cayman Business & Career Expo 2026.
          {receiptUploaded ? " Your receipt is in review — we'll confirm by email or WhatsApp." : " Now please submit your payment to finalize your booth."}
        </p>
        <div className="mt-6 inline-flex items-center gap-4 px-5 py-3 rounded-xl bg-[color:var(--color-cream)] text-[color:var(--color-navy-900)]">
          <span className="text-sm">Amount due:</span>
          <span className="font-display text-2xl">${amount / 100}</span>
          <span className="text-xs text-[color:var(--color-navy-600)]">({reason.replace("_", " ").toLowerCase()})</span>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display text-lg">Next steps</h3>
        <ol className="mt-3 space-y-2 text-sm text-[color:var(--color-navy-800)] list-decimal pl-4">
          <li>Pay at RBC to <strong>{SITE.rbcAccount.name}</strong>, account <strong>#{SITE.rbcAccount.number}</strong>.</li>
          <li>{receiptUploaded ? "Your receipt is uploaded — admin will verify shortly." : <>Upload your receipt or send it to <a className="underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>.</>}</li>
          <li>You'll receive booth details and exhibitor instructions by email closer to the event.</li>
        </ol>
      </div>
    </div>
  );
}
