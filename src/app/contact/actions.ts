"use server";

import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validators";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function submitContact(formData: FormData): Promise<ContactResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  try {
    await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        inquiry: data.inquiry,
        message: data.message,
      },
    });
    // TODO: email notification to CONTACT_INBOX once SMTP is configured
    return { ok: true };
  } catch (err) {
    console.error("Contact submit failed:", err);
    return { ok: false, error: "Something went wrong sending your message. Please try again or email us directly." };
  }
}
