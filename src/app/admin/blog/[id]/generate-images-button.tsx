"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

type JobStatus = "PENDING" | "RUNNING" | "DONE" | "ERROR" | null;

interface Props {
  postId: string;
  initialStatus: JobStatus;
  initialStage: string | null;
  initialError: string | null;
}

// Persisted stages -> progress %. The bar reflects REAL job stages the worker
// writes, not a fake timer.
const STAGE_PCT: Record<string, number> = {
  queued: 8,
  prompts: 25,
  rendering: 65,
  finishing: 90,
  done: 100,
};

const POLL_MS = 2500;
const UI_TIMEOUT_MS = 4 * 60 * 1000;

export function GenerateImagesButton({ postId, initialStatus, initialStage, initialError }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const [stage, setStage] = useState<string | null>(initialStage);
  const [error, setError] = useState<string | null>(initialError);
  const [timedOut, setTimedOut] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const active = status === "PENDING" || status === "RUNNING";
  const pct = stage ? STAGE_PCT[stage] ?? 15 : 0;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    // Give up after the UI timeout — the job may still finish server-side.
    if (Date.now() - startedAtRef.current > UI_TIMEOUT_MS) {
      stopPolling();
      setTimedOut(true);
      return;
    }
    try {
      const res = await fetch(`/api/admin/blog/${postId}/image-status`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { status: JobStatus; stage: string | null; error: string | null };
      setStatus(data.status);
      setStage(data.stage);
      if (data.status === "DONE") {
        stopPolling();
        router.refresh(); // reload the editor to show the new images
      } else if (data.status === "ERROR") {
        stopPolling();
        setError(data.error ?? "Image generation failed");
      }
    } catch {
      /* transient — keep polling */
    }
  }, [postId, router, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    startedAtRef.current = Date.now();
    setTimedOut(false);
    pollRef.current = setInterval(poll, POLL_MS);
  }, [poll, stopPolling]);

  // Resume polling if the page loaded while a job was already in flight.
  useEffect(() => {
    if (initialStatus === "PENDING" || initialStatus === "RUNNING") startPolling();
    return stopPolling;
  }, [initialStatus, startPolling, stopPolling]);

  async function start() {
    setError(null);
    setTimedOut(false);
    setStatus("PENDING");
    setStage("queued");
    try {
      const res = await fetch(`/api/admin/blog/${postId}/generate-images`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setStatus("ERROR");
        setError(data?.error ?? "Could not start image generation");
        return;
      }
      startPolling();
    } catch {
      setStatus("ERROR");
      setError("Could not start image generation");
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={start}
        disabled={active}
        className="btn btn-outline text-sm w-fit disabled:opacity-60"
      >
        <Sparkles size={15} />
        {active ? "Generating images…" : "Generate images with AI"}
      </button>

      {active && (
        <div className="grid gap-1">
          <div className="h-2 rounded-full bg-[color:var(--color-cream)] overflow-hidden">
            <div
              className="h-full bg-[color:var(--color-gold-400)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-[color:var(--color-navy-600)] capitalize">
            {stage ?? "starting"}… ({pct}%)
          </p>
        </div>
      )}

      {timedOut && (
        <p className="text-xs text-[color:var(--color-navy-600)]">
          Still working — this is taking a while. Refresh the page in a minute to see the result.
        </p>
      )}
      {status === "ERROR" && error && <p className="text-xs text-red-600">{error}</p>}

      <p className="text-xs text-[color:var(--color-navy-600)]">
        Generates a cover image (whole article) and an in-text image (one detail),
        then wires both into the post.
      </p>
    </div>
  );
}
