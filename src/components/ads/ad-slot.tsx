"use client";

import { useEffect, useRef, useState } from "react";
import type { AdVariant } from "./placements";

interface Ad {
  adId: string;
  campaignId: string;
  creativeId: string;
  placementId: string;
  platformId?: string;
  creativeType?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  destinationUrl?: string;
  ctaText?: string;
  width?: number;
  height?: number;
  label?: string;
}

const ANON_KEY = "cae_anon_id";

function getAnonymousUserId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `anon-${Math.random().toString(36).slice(2)}-${Date.now()}`;
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "server";
  }
}

export interface AdSlotProps {
  placement: string;
  userRole?: string;
  category?: string;
  variant?: AdVariant;
  className?: string;
}

export function AdSlot({
  placement,
  userRole = "GUEST",
  category,
  variant = "card",
  className,
}: AdSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionSent = useRef(false);

  // Fetch the ad async; never throw into the host page.
  useEffect(() => {
    let active = true;
    const q = new URLSearchParams({ placement, userRole });
    if (category) q.set("category", category);
    if (typeof window !== "undefined") q.set("pageUrl", window.location.href);

    fetch(`/internal/ads/serve?${q.toString()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ad?: Ad | null } | null) => {
        if (active && d && d.ad) setAd(d.ad);
      })
      .catch(() => {
        /* fail silent */
      });
    return () => {
      active = false;
    };
  }, [placement, userRole, category]);

  // Record an impression once the ad is >=50% visible.
  useEffect(() => {
    if (!ad || !containerRef.current || impressionSent.current) return;
    const el = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.5 &&
            !impressionSent.current
          ) {
            impressionSent.current = true;
            const payload = JSON.stringify({
              adId: ad.adId,
              campaignId: ad.campaignId,
              creativeId: ad.creativeId,
              placementId: ad.placementId,
              anonymousUserId: getAnonymousUserId(),
              userRole,
              pageUrl:
                typeof window !== "undefined" ? window.location.href : "",
            });
            const url = "/internal/ads/impression";
            try {
              if (
                typeof navigator !== "undefined" &&
                typeof navigator.sendBeacon === "function"
              ) {
                navigator.sendBeacon(
                  url,
                  new Blob([payload], { type: "application/json" }),
                );
              } else {
                fetch(url, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: payload,
                  keepalive: true,
                }).catch(() => {});
              }
            } catch {
              /* best effort */
            }
            observer.disconnect();
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ad, userRole]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!ad) return;
    try {
      const res = await fetch("/internal/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adId: ad.adId,
          campaignId: ad.campaignId,
          creativeId: ad.creativeId,
          placementId: ad.placementId,
          anonymousUserId: getAnonymousUserId(),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        destinationUrl?: string | null;
      } | null;
      const dest = data?.destinationUrl;
      if (dest && typeof window !== "undefined") {
        window.open(dest, "_blank", "noopener,noreferrer");
      }
    } catch {
      /* fail silent */
    }
  }

  if (!ad) return null;

  const label = ad.label || "Sponsored";

  return (
    <div ref={containerRef} className={className}>
      {variant === "banner" && (
        <a
          href={ad.destinationUrl || "#"}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group relative block overflow-hidden rounded-xl border border-[color:var(--color-navy-100)] bg-white"
        >
          {ad.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.imageUrl}
              alt={ad.title ?? "Advertisement"}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          )}
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              {ad.title && (
                <p className="font-display text-sm md:text-base truncate">
                  {ad.title}
                </p>
              )}
              {ad.description && (
                <p className="text-xs text-[color:var(--color-navy-600)] truncate">
                  {ad.description}
                </p>
              )}
            </div>
            {ad.ctaText && (
              <span className="btn btn-gold text-xs whitespace-nowrap">
                {ad.ctaText}
              </span>
            )}
          </div>
          <AdLabel label={label} />
        </a>
      )}

      {variant === "card" && (
        <a
          href={ad.destinationUrl || "#"}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="card relative block overflow-hidden hover:border-[color:var(--color-navy-300)] transition-colors"
        >
          {ad.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.imageUrl}
              alt={ad.title ?? "Advertisement"}
              className="w-full h-32 object-cover"
              loading="lazy"
            />
          )}
          <div className="p-5">
            {ad.title && <p className="font-display text-base">{ad.title}</p>}
            {ad.description && (
              <p className="mt-1.5 text-sm text-[color:var(--color-navy-700)] leading-relaxed line-clamp-3">
                {ad.description}
              </p>
            )}
            {ad.ctaText && (
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-gold-700)]">
                {ad.ctaText} →
              </span>
            )}
          </div>
          <AdLabel label={label} />
        </a>
      )}

      {variant === "native" && (
        <a
          href={ad.destinationUrl || "#"}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="card relative flex gap-4 p-4 hover:border-[color:var(--color-navy-300)] transition-colors"
        >
          {ad.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.imageUrl}
              alt={ad.title ?? "Advertisement"}
              className="size-16 rounded-lg object-cover shrink-0"
              loading="lazy"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {ad.title && (
                <p className="font-medium text-sm truncate">{ad.title}</p>
              )}
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-[color:var(--color-navy-500)] border border-[color:var(--color-navy-100)] rounded px-1.5 py-0.5">
                {label}
              </span>
            </div>
            {ad.description && (
              <p className="mt-1 text-xs text-[color:var(--color-navy-600)] line-clamp-2">
                {ad.description}
              </p>
            )}
            {ad.ctaText && (
              <span className="mt-1.5 inline-block text-xs font-medium text-[color:var(--color-gold-700)]">
                {ad.ctaText} →
              </span>
            )}
          </div>
        </a>
      )}
    </div>
  );
}

function AdLabel({ label }: { label: string }) {
  return (
    <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide text-white/90 bg-black/45 backdrop-blur-sm rounded px-1.5 py-0.5">
      {label}
    </span>
  );
}
