"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, requireSuperadmin } from "@/lib/rbac";

// ----- Member moderation -----
export async function approveMember(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } }),
    prisma.memberProfile.update({
      where: { userId },
      data: { membershipStatus: "ACTIVE", joinedAt: new Date() },
    }),
  ]);
  revalidatePath("/admin/members");
}

export async function rejectMember(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  await prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  await prisma.memberProfile.updateMany({ where: { userId }, data: { membershipStatus: "REVOKED" } });
  revalidatePath("/admin/members");
}

export async function changeRole(formData: FormData) {
  await requireSuperadmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "MEMBER") as "MEMBER" | "EXHIBITOR" | "ADMIN" | "SUPERADMIN";
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/members");
}

// ----- Listing moderation -----
export async function approveListing(formData: FormData) {
  await requireAdmin();
  const listingId = String(formData.get("listingId") ?? "");
  await prisma.businessListing.update({ where: { id: listingId }, data: { status: "APPROVED" } });
  revalidatePath("/admin/listings");
  revalidatePath("/directory");
}

export async function rejectListing(formData: FormData) {
  await requireAdmin();
  const listingId = String(formData.get("listingId") ?? "");
  await prisma.businessListing.update({ where: { id: listingId }, data: { status: "REJECTED" } });
  revalidatePath("/admin/listings");
  revalidatePath("/directory");
}

export async function toggleFeatured(formData: FormData) {
  await requireAdmin();
  const listingId = String(formData.get("listingId") ?? "");
  const current = await prisma.businessListing.findUnique({ where: { id: listingId }, select: { isFeatured: true } });
  await prisma.businessListing.update({ where: { id: listingId }, data: { isFeatured: !current?.isFeatured } });
  revalidatePath("/admin/listings");
  revalidatePath("/directory");
}

// ----- Expo registration management -----
export async function markPaid(formData: FormData) {
  const admin = await requireAdmin();
  const registrationId = String(formData.get("registrationId") ?? "");
  await prisma.$transaction(async (tx) => {
    const reg = await tx.expoRegistration.update({
      where: { id: registrationId },
      data: { paymentStatus: "PAID", receiptStatus: "APPROVED" },
    });
    await tx.paymentReceipt.updateMany({
      where: { expoRegistrationId: reg.id, status: "UPLOADED" },
      data: { status: "APPROVED", reviewedBy: admin.id, reviewedAt: new Date() },
    });
  });
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/receipts");
}

export async function rejectPayment(formData: FormData) {
  const admin = await requireAdmin();
  const registrationId = String(formData.get("registrationId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  await prisma.$transaction(async (tx) => {
    await tx.expoRegistration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: "REJECTED",
        receiptStatus: "REJECTED",
        adminNotes: note || undefined,
      },
    });
    await tx.paymentReceipt.updateMany({
      where: { expoRegistrationId: registrationId, status: "UPLOADED" },
      data: { status: "REJECTED", reviewedBy: admin.id, reviewedAt: new Date(), adminNotes: note || undefined },
    });
  });
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/receipts");
}

export async function saveRegistrationNote(formData: FormData) {
  await requireAdmin();
  const registrationId = String(formData.get("registrationId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  await prisma.expoRegistration.update({
    where: { id: registrationId },
    data: { adminNotes: note || null },
  });
  revalidatePath("/admin/registrations");
}

// ----- Announcements -----
export async function publishAnnouncement(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "ALL") as "ALL" | "MEMBERS" | "EXHIBITORS" | "ADMINS";
  const publish = formData.get("publish") === "true";

  if (id) {
    await prisma.announcement.update({
      where: { id },
      data: {
        title, body, audience,
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
      },
    });
  } else {
    await prisma.announcement.create({
      data: {
        title, body, audience,
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
        authorId: admin.id,
      },
    });
  }
  revalidatePath("/admin/announcements");
}

export async function archiveAnnouncement(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.announcement.update({ where: { id }, data: { status: "ARCHIVED" } });
  revalidatePath("/admin/announcements");
}
