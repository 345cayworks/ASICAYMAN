import { prisma } from "@/lib/db";

export interface TrackingSettings {
  enabled: boolean;
  gaId: string | null;
  fbPixelId: string | null;
  enabledUpdatedAt: Date | null;
  gaUpdatedAt: Date | null;
  fbUpdatedAt: Date | null;
  updatedByEmail: string | null;
}

const KEYS = {
  enabled: "platform.tracking.enabled",
  ga: "platform.tracking.ga.id",
  fb: "platform.tracking.fb.pixelId",
} as const;

export async function getTrackingSettings(): Promise<TrackingSettings> {
  try {
    const rows = await prisma.systemSetting.findMany({
      where: { key: { in: [KEYS.enabled, KEYS.ga, KEYS.fb] } },
    });
    const map = new Map(rows.map((r) => [r.key, r] as const));
    const enabledRow = map.get(KEYS.enabled);
    const gaRow = map.get(KEYS.ga);
    const fbRow = map.get(KEYS.fb);

    const newest = [enabledRow, gaRow, fbRow]
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

    return {
      enabled: enabledRow?.value === "true",
      gaId: gaRow?.value ? gaRow.value : null,
      fbPixelId: fbRow?.value ? fbRow.value : null,
      enabledUpdatedAt: enabledRow?.updatedAt ?? null,
      gaUpdatedAt: gaRow?.updatedAt ?? null,
      fbUpdatedAt: fbRow?.updatedAt ?? null,
      updatedByEmail: newest?.updatedByEmail ?? null,
    };
  } catch {
    return {
      enabled: false,
      gaId: null,
      fbPixelId: null,
      enabledUpdatedAt: null,
      gaUpdatedAt: null,
      fbUpdatedAt: null,
      updatedByEmail: null,
    };
  }
}
