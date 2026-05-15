"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { computeExpoPrice } from "@/lib/pricing";
import { expoRegistrationSchema, type ExpoRegistrationInput } from "@/lib/validators";
import { getStorage, ALLOWED_RECEIPT_TYPES, MAX_RECEIPT_BYTES } from "@/lib/storage";
import { auth } from "@/lib/auth";

const EXPO_SLUG = "business-career-expo-2026";

export type ExpoRegistrationResult =
  | { ok: true; registrationId: string; amount: number; reason: "MEMBER" | "EARLY_BIRD" | "REGULAR"; receiptUploaded: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function registerForExpo(formData: FormData): Promise<ExpoRegistrationResult> {
  // 1. Parse + validate the form data
  const raw = Object.fromEntries(formData.entries());

  // Booleans arrive from <input type="checkbox">, normalize before zod
  const normalized = {
    fullName: raw.fullName,
    businessName: raw.businessName,
    email: raw.email,
    phone: raw.phone,
    businessCategory: raw.businessCategory,
    isAsiMember: raw.isAsiMember === "on" || raw.isAsiMember === "true",
    needsBooth: raw.needsBooth === "on" || raw.needsBooth === "true",
    wantsVideoSubmission: raw.wantsVideoSubmission === "on" || raw.wantsVideoSubmission === "true",
    promoVideoUrl: raw.promoVideoUrl,
    wantsInterview: raw.wantsInterview === "on" || raw.wantsInterview === "true",
  };

  const parsed = expoRegistrationSchema.safeParse(normalized);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const data: ExpoRegistrationInput = parsed.data;

  // 2. Load the active expo event
  const event = await prisma.event.findUnique({ where: { slug: EXPO_SLUG } });
  if (!event) {
    return { ok: false, error: "The expo event is not configured yet. Please contact ASI Cayman." };
  }
  if (!event.registrationOpen) {
    return { ok: false, error: "Registration for this event is closed." };
  }

  // 3. If the user claims ASI member, verify against an active member profile
  let verifiedAsiMember = false;
  const session = await auth();
  if (data.isAsiMember) {
    // Try to match by logged-in account first, then by submitted email
    const user = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { memberProfile: true },
        })
      : await prisma.user.findUnique({
          where: { email: data.email },
          include: { memberProfile: true },
        });

    verifiedAsiMember = !!user?.memberProfile && user.memberProfile.membershipStatus === "ACTIVE";
    // If they claim it but we can't verify, we still mark them — but admin will validate
    // before approving payment. Pricing falls back to early-bird/regular below.
  }

  // 4. Compute the price server-side. NEVER trust client.
  const pricing = computeExpoPrice(event, { isAsiMember: verifiedAsiMember });

  // 5. Optional receipt upload (multipart)
  const receiptFile = formData.get("receipt") as File | null;
  let receiptStored: { url: string; size: number; contentType: string } | null = null;

  if (receiptFile && receiptFile.size > 0) {
    if (receiptFile.size > MAX_RECEIPT_BYTES) {
      return { ok: false, error: "Receipt is larger than 8 MB. Please upload a smaller file." };
    }
    if (!ALLOWED_RECEIPT_TYPES.has(receiptFile.type)) {
      return { ok: false, error: "Receipt must be a JPG, PNG, HEIC, WEBP, or PDF file." };
    }
    const buf = Buffer.from(await receiptFile.arrayBuffer());
    const stored = await getStorage().put({
      folder: "receipts/expo-2026",
      filename: receiptFile.name,
      contentType: receiptFile.type,
      body: buf,
    });
    receiptStored = { url: stored.url, size: stored.size, contentType: stored.contentType };
  }

  // 6. Persist registration (upsert by event+email so re-registration updates)
  try {
    const registration = await prisma.expoRegistration.upsert({
      where: { eventId_email: { eventId: event.id, email: data.email } },
      update: {
        fullName: data.fullName,
        businessName: data.businessName,
        phone: data.phone,
        businessCategory: data.businessCategory,
        isAsiMember: data.isAsiMember,
        needsBooth: data.needsBooth,
        wantsVideoSubmission: data.wantsVideoSubmission,
        promoVideoUrl: data.promoVideoUrl || null,
        wantsInterview: data.wantsInterview,
        paymentAmount: pricing.amount,
        earlyBirdApplied: pricing.earlyBirdApplied,
        userId: session?.user?.id ?? undefined,
        ...(receiptStored && {
          receiptUrl: receiptStored.url,
          receiptStatus: "UPLOADED",
          paymentStatus: "RECEIPT_UPLOADED",
        }),
      },
      create: {
        eventId: event.id,
        userId: session?.user?.id ?? null,
        fullName: data.fullName,
        businessName: data.businessName,
        email: data.email,
        phone: data.phone,
        businessCategory: data.businessCategory,
        isAsiMember: data.isAsiMember,
        needsBooth: data.needsBooth,
        wantsVideoSubmission: data.wantsVideoSubmission,
        promoVideoUrl: data.promoVideoUrl || null,
        wantsInterview: data.wantsInterview,
        paymentAmount: pricing.amount,
        earlyBirdApplied: pricing.earlyBirdApplied,
        paymentStatus: receiptStored ? "RECEIPT_UPLOADED" : "PENDING",
        receiptUrl: receiptStored?.url ?? null,
        receiptStatus: receiptStored ? "UPLOADED" : "NONE",
      },
    });

    // 7. Also write a PaymentReceipt record if uploaded (audit trail)
    if (receiptStored) {
      await prisma.paymentReceipt.create({
        data: {
          userId: session?.user?.id ?? null,
          expoRegistrationId: registration.id,
          amount: pricing.amount,
          paymentMethod: "RBC_TRANSFER",
          receiptFileUrl: receiptStored.url,
          status: "UPLOADED",
        },
      });
    }

    revalidatePath("/admin/registrations");

    return {
      ok: true,
      registrationId: registration.id,
      amount: pricing.amount,
      reason: pricing.reason,
      receiptUploaded: !!receiptStored,
    };
  } catch (err) {
    console.error("Expo registration failed:", err);
    return { ok: false, error: "Something went wrong saving your registration. Please try again." };
  }
}
