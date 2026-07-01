"use client";

import { useState } from "react";
import { ImagePlus, Copy, Check } from "lucide-react";

/**
 * Uploads an inline image and shows a Markdown snippet to paste into the body.
 */
export function InlineImageUploader() {
  const [busy, setBusy] = useState(false);
  const [snippet, setSnippet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setSnippet(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("alt", file.name.replace(/\.[a-z0-9]+$/i, ""));
      const res = await fetch("/api/admin/blog/inline-image", { method: "POST", body: fd });
      const data = (await res.json()) as { markdown?: string; error?: string };
      if (!res.ok || !data.markdown) throw new Error(data.error || "Upload failed");
      setSnippet(data.markdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function copy() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-2">
      <label className="btn btn-outline text-sm cursor-pointer w-fit">
        <ImagePlus size={15} /> {busy ? "Uploading…" : "Upload inline image"}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {snippet && (
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-[color:var(--color-cream)] rounded px-2 py-1.5 overflow-x-auto">
            {snippet}
          </code>
          <button type="button" onClick={copy} className="btn btn-outline text-xs shrink-0">
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <p className="text-xs text-[color:var(--color-navy-600)]">
        Paste the snippet into the body where you want the image to appear.
      </p>
    </div>
  );
}
