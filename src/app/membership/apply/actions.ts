"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { membershipApplicationSchema } from "@/lib/validators";
import { getMembershipCategory } from "@/lib/membership";
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
  const {
    name,
    phone,
    email,
    businessOrProfession,
    churchAffiliation,
    membershipCategory,
    password,
  } = parsed.data;

  const category = getMembershipCategory(membershipCategory);
  if (!category) {
    return { ok: false, error: "Please select a membership category." };
  }

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
      passwordHash,
      role: "MEMBER",
      status: "PENDING",
      memberProfile: {
        create: {
          membershipStatus: "PENDING",
          membershipType: category.type,
          membershipCategory: category.value,
          businessOrProfession,
          churchAffiliation,
          bio: `Applied as: ${category.label} (annual fee CI$${category.feeKyd}). Commitment accepted.`,
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
