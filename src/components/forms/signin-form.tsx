"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, AlertCircle } from "lucide-react";

export function SignInForm({ callbackUrl, initialError }: { callbackUrl?: string; initialError?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError ?? null);

  const target = callbackUrl ?? params.get("callbackUrl") ?? "/dashboard";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    startTransition(async () => {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res || res.error) {
        setError("Invalid email or password.");
        return;
      }
      router.push(target);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {error && (
        <div className="flex gap-2.5 p-3 rounded-lg bg-red-50 text-red-900 border border-red-100 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
        </div>
      )}

      <label className="block">
        <span className="field-label">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field-input" />
      </label>

      <label className="block">
        <span className="field-label">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className="field-input" />
      </label>

      <button type="submit" disabled={pending} className="btn btn-primary mt-2">
        {pending ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : "Sign in"}
      </button>
    </form>
  );
}
