"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSuperadmin } from "@/lib/rbac";
import {
  normalizeGaId,
  isValidGaId,
  isValidFbPixelId,
} from "@/lib/tracking-validate";

const ERRORS = {
  ga: "Google Analytics ID must look like G-XXXXXXXX.",
  fb: "Facebook Pixel ID must be 6–20 digits.",
} as const;

function fail(message: string): never {
  redirect("/admin/settings?error=" + encodeURIComponent(message));
}

export async function updateTrackingSettings(formData: FormData) {
  const user = await requireSuperadmin();

  const enabled = formData.get("enabled") === "on";
  const gaRaw = String(formData.get("gaId") ?? "");
  const fbRaw = String(formData.get("fbPixelId") ?? "");

  const gaId = gaRaw.trim() === "" ? "" : normalizeGaId(gaRaw);
  const fbPixelId = fbRaw.trim();

  if (gaId !== "" && !isValidGaId(gaId)) fail(ERRORS.ga);
  if (fbPixelId !== "" && !isValidFbPixelId(fbPixelId)) fail(ERRORS.fb);

  const updatedById = user.id ?? null;
  const updatedByEmail = user.email ?? null;
  const enabledValue = enabled ? "true" : "false";

  const upsert = (key: string, value: string) =>
    prisma.systemSetting.upsert({
      where: { key },
      create: { key, value, updatedById, updatedByEmail },
      update: { value, updatedById, updatedByEmail },
    });

  await prisma.$transaction([
    upsert("platform.tracking.enabled", enabledValue),
    upsert("platform.tracking.ga.id", gaId),
    upsert("platform.tracking.fb.pixelId", fbPixelId),
    prisma.auditLog.create({
      data: {
        actorUserId: updatedById,
        actorEmail: updatedByEmail,
        action: "tracking.update",
        entity: "SystemSetting:platform.tracking.*",
        // Booleans only — never persist the raw IDs.
        details: {
          enabled,
          gaIdSet: gaId !== "",
          fbPixelSet: fbPixelId !== "",
        },
      },
    }),
  ]);

  // Push the script change across every page immediately.
  revalidatePath("/", "layout");
  redirect("/admin/settings?ok=1");
}
