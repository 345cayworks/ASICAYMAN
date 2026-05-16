"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { membershipApplicationSchema } from "@/lib/validators";
import { signIn } from "@/lib/auth";

export type MembershipApplicationResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function applyForMembership(
  formData: FormData,
): Promise<MembershipApplicationResult> {
  const parsed = membershipApplicationSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const { name, email, phone, whatsapp, churchAffiliation, membershipType, reason, password } =
    parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An account already exists with that email. Please sign in." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      phone,
      whatsapp: whatsapp || null,
      passwordHash,
      role: "MEMBER",
      status: "PENDING",
      memberProfile: {
        create: {
          membershipStatus: "PENDING",
          membershipType,
          churchAffiliation,
          bio: reason,
        },
      },
    },
  });

  // Auto sign-in so they land on their dashboard while the application is reviewed.
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    // ignore — they can sign in manually
  }

  redirect("/dashboard?welcome=1&applied=1");
}
