"use client";

import { useState, useTransition } from "react";
import { KeyRound, Copy, Check, X } from "lucide-react";
import { resetMemberPassword } from "@/app/admin/actions";

interface Props {
  userId: string;
  email: string;
}

// SUPERADMIN-only password reset button. Calls the server action and surfaces
// the freshly generated temp password in a one-time modal — once dismissed,
// the password is gone from the page state. Admin is expected to copy it and
// share it with the user via a secure side-channel, then have them change it
// on first sign-in.
export function ResetPasswordButton({ userId, email }: Props) {
  const [pending, startTransition] = useTransition();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function start() {
    setError(null);
    if (
      !confirm(
        `Reset password for ${email}? A fresh temp password will be shown to you ONCE — share it with the user securely.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await resetMemberPassword(userId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTempPassword(res.tempPassword);
    });
  }

  async function copyToClipboard() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — admin can still read it on screen */
    }
  }

  function dismiss() {
    setTempPassword(null);
    setCopied(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="btn btn-outline text-xs py-1.5 px-3 w-full disabled:opacity-60"
      >
        <KeyRound size={12} /> {pending ? "Resetting…" : "Reset password"}
      </button>

      {error && (
        <p className="mt-1 text-[11px] text-red-700">{error}</p>
      )}

      {tempPassword && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-pw-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={dismiss}
        >
          <div
            className="card max-w-md w-full bg-white text-[color:var(--color-navy-900)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-eyebrow">Password reset</p>
                <h3
                  id="reset-pw-title"
                  className="mt-1 font-display text-xl"
                >
                  Temporary password
                </h3>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close"
                className="text-[color:var(--color-navy-500)] hover:text-[color:var(--color-navy-900)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm text-[color:var(--color-navy-700)]">
              Share this with <strong>{email}</strong> via a secure channel.
              They should change it on first sign-in. This password will not be
              shown again.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <code className="flex-1 font-mono text-lg tracking-wide bg-[color:var(--color-cream)] border border-[color:var(--color-navy-100)] rounded-md px-3 py-2 break-all">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={copyToClipboard}
                className="btn btn-primary text-sm py-2 px-3 shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={dismiss}
                className="btn btn-outline text-sm py-2 px-4"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
