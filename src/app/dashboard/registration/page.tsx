import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ArrowRight, CheckCircle2, AlertCircle, Clock, Upload } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatDollars } from "@/lib/pricing";
import { getStorage, ALLOWED_RECEIPT_TYPES, MAX_RECEIPT_BYTES } from "@/lib/storage";
import { SITE } from "@/lib/utils";

export const metadata = { title: "Expo registration" };

async function uploadReceipt(formData: FormData): Promise<void> {
  "use server";
  const user = await requireUser();
  const registrationId = String(formData.get("registrationId") ?? "");
  const file = formData.get("receipt") as File | null;

  if (!file || file.size === 0) return;
  if (file.size > MAX_RECEIPT_BYTES) return;
  if (!ALLOWED_RECEIPT_TYPES.has(file.type)) return;

  const registration = await prisma.expoRegistration.findUnique({ where: { id: registrationId } });
  if (!registration) return;
  if (registration.email !== user.email && registration.userId !== user.id) return;

  const buf = Buffer.from(await file.arrayBuffer());
  const stored = await getStorage().put({
    folder: "receipts/expo-2026",
    filename: file.name,
    contentType: file.type,
    body: buf,
  });

  await prisma.expoRegistration.update({
    where: { id: registration.id },
    data: { receiptUrl: stored.url, receiptStatus: "UPLOADED", paymentStatus: "RECEIPT_UPLOADED" },
  });
  await prisma.paymentReceipt.create({
    data: {
      userId: user.id,
      expoRegistrationId: registration.id,
      amount: registration.paymentAmount,
      paymentMethod: "RBC_TRANSFER",
      receiptFileUrl: stored.url,
      status: "UPLOADED",
    },
  });

  revalidatePath("/dashboard/registration");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/receipts");
}

export default async function MyRegistrationPage() {
  const sessionUser = await requireUser();
  const registration = await prisma.expoRegistration.findFirst({
    where: { OR: [{ email: sessionUser.email ?? "" }, { userId: sessionUser.id }] },
    orderBy: { createdAt: "desc" },
    include: { event: true },
  });

  if (!registration) {
    return (
      <div className="grid gap-6">
        <header>
          <p className="section-eyebrow">Expo 2026</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">No registration yet</h1>
        </header>
        <div className="card p-10 text-center">
          <p className="text-[color:var(--color-navy-700)] max-w-md mx-auto">
            You haven't registered a booth for the ASI Cayman Business & Career Expo 2026 yet.
          </p>
          <Link href="/expo/register" className="mt-6 btn btn-gold inline-flex">
            Register a booth <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="section-eyebrow">Expo 2026</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">{registration.businessName}</h1>
          <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
            Registered for the ASI Cayman Business & Career Expo on {registration.event.startDate.toDateString()}.
          </p>
        </div>
        <PaymentBadge status={registration.paymentStatus} />
      </header>

      <section className="grid md:grid-cols-2 gap-5">
        <div className="card p-6">
          <p className="section-eyebrow">Amount</p>
          <p className="mt-2 font-display text-3xl text-[color:var(--color-navy-900)]">
            {formatDollars(registration.paymentAmount)}
          </p>
          <p className="mt-1 text-xs text-[color:var(--color-navy-600)]">
            {registration.earlyBirdApplied ? "Early-bird pricing" : registration.isAsiMember ? "ASI member pricing" : "Regular pricing"}
          </p>
          <div className="hairline my-5" />
          <p className="text-sm text-[color:var(--color-navy-700)] leading-relaxed">
            Pay at RBC to <strong>{SITE.rbcAccount.name}</strong>, account <strong>#{SITE.rbcAccount.number}</strong>.
          </p>
        </div>

        <div className="card p-6">
          <p className="section-eyebrow">Receipt</p>
          {registration.receiptUrl ? (
            <div className="mt-3">
              <p className="text-sm text-[color:var(--color-navy-700)]">
                Receipt uploaded — {registration.receiptStatus === "APPROVED" ? "approved" : "under review"}.
              </p>
              <a href={registration.receiptUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-[color:var(--color-navy-900)] underline underline-offset-4">
                View receipt <ArrowRight size={14} />
              </a>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">No receipt uploaded yet.</p>
          )}

          <form action={uploadReceipt} className="mt-5 grid gap-3">
            <input type="hidden" name="registrationId" value={registration.id} />
            <label className="block cursor-pointer">
              <span className="field-label">{registration.receiptUrl ? "Replace receipt" : "Upload your receipt"}</span>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[color:var(--color-navy-200)] hover:border-[color:var(--color-navy-800)]">
                <Upload size={16} className="text-[color:var(--color-navy-600)]" />
                <span className="text-xs text-[color:var(--color-navy-700)]">JPG, PNG, HEIC, WEBP or PDF · max 8 MB</span>
              </div>
              <input name="receipt" type="file" className="sr-only" accept="image/jpeg,image/png,image/heic,image/webp,application/pdf" />
            </label>
            <button className="btn btn-primary self-start text-sm">Upload</button>
          </form>
        </div>
      </section>

      <section className="card p-6">
        <p className="section-eyebrow">Your details</p>
        <dl className="mt-4 grid sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
          <Row label="Full name" value={registration.fullName} />
          <Row label="Email" value={registration.email} />
          <Row label="Phone" value={registration.phone} />
          <Row label="Category" value={registration.businessCategory} />
          <Row label="ASI member" value={registration.isAsiMember ? "Yes" : "No"} />
          <Row label="Booth needed" value={registration.needsBooth ? "Yes" : "No"} />
          <Row label="Video submission" value={registration.wantsVideoSubmission ? "Yes" : "No"} />
          <Row label="Studio interview interest" value={registration.wantsInterview ? "Yes" : "No"} />
        </dl>
        {registration.promoVideoUrl && (
          <p className="mt-3 text-sm">
            <span className="text-[color:var(--color-navy-600)]">Promo video: </span>
            <a className="underline" href={registration.promoVideoUrl} target="_blank" rel="noreferrer">{registration.promoVideoUrl}</a>
          </p>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-[color:var(--color-navy-600)]">{label}</dt>
      <dd className="mt-0.5 text-[color:var(--color-navy-900)]">{value}</dd>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
    PENDING: { className: "badge-pending", icon: <Clock size={12} />, label: "Awaiting payment" },
    RECEIPT_UPLOADED: { className: "badge-pending", icon: <Clock size={12} />, label: "Receipt in review" },
    VERIFIED: { className: "badge-paid", icon: <CheckCircle2 size={12} />, label: "Verified" },
    PAID: { className: "badge-approved", icon: <CheckCircle2 size={12} />, label: "Paid" },
    REJECTED: { className: "badge-rejected", icon: <AlertCircle size={12} />, label: "Rejected" },
    REFUNDED: { className: "badge-paid", icon: <CheckCircle2 size={12} />, label: "Refunded" },
  };
  const m = map[status] ?? map.PENDING;
  return <span className={`badge ${m.className}`}>{m.icon} {m.label}</span>;
}
