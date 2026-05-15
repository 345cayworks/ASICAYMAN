"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signUpSchema } from "@/lib/validators";
import { signIn } from "@/lib/auth";

export type SignUpResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function signUpAction(formData: FormData): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An account already exists with that email." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      role: "MEMBER",
      status: "PENDING",
      memberProfile: {
        create: {
          membershipStatus: "PENDING",
          membershipType: "INDIVIDUAL",
        },
      },
    },
  });

  // Auto sign-in so the user lands on their dashboard
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    // ignore — they can manually sign in
  }

  redirect("/dashboard?welcome=1");
}
