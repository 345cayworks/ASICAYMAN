import { prisma } from "@/lib/db";
import { formatDollars } from "@/lib/pricing";
import { markPaid, rejectPayment } from "@/app/admin/actions";
import { CheckCircle2, X } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Receipts queue" };

export default async function AdminReceiptsPage() {
  const pending = await prisma.paymentReceipt.findMany({
    where: { status: "UPLOADED" },
    orderBy: { createdAt: "asc" },
    include: { expoRegistration: true, user: true },
  });

  return (
    <div className="grid gap-6">
      <header>
        <p className="section-eyebrow">Admin</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Receipts awaiting review</h1>
        <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
          {pending.length} {pending.length === 1 ? "receipt" : "receipts"} pending review.
        </p>
      </header>

      {pending.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle2 size={28} className="mx-auto text-[color:var(--color-teal-600)]" />
          <p className="mt-3 text-[color:var(--color-navy-700)]">All caught up.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.map((r) => (
            <article key={r.id} className="card p-5 grid md:grid-cols-[1fr_auto] gap-5 items-start">
              <div>
                <p className="text-xs uppercase tracking-wider text-[color:var(--color-navy-600)]">{r.paymentMethod}</p>
                <p className="mt-1 font-display text-xl">
                  {r.expoRegistration?.businessName ?? "—"}
                </p>
                <p className="text-sm text-[color:var(--color-navy-700)]">
                  {r.expoRegistration?.fullName} · {r.expoRegistration?.email}
                </p>
                <p className="mt-2 text-sm">
                  Amount: <strong>{formatDollars(r.amount)}</strong> · uploaded {r.createdAt.toLocaleDateString()}
                </p>
                <a href={r.receiptFileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-navy-900)] underline">
                  View receipt file
                </a>
              </div>
              <div className="flex flex-col gap-2 md:min-w-[200px]">
                {r.expoRegistrationId && (
                  <>
                    <form action={markPaid}>
                      <input type="hidden" name="registrationId" value={r.expoRegistrationId} />
                      <button className="btn btn-primary text-sm w-full"><CheckCircle2 size={14} /> Approve & mark paid</button>
                    </form>
                    <form action={rejectPayment} className="flex flex-col gap-1">
                      <input type="hidden" name="registrationId" value={r.expoRegistrationId} />
                      <input name="note" placeholder="Reason (optional)" className="field-input text-sm" />
                      <button className="btn btn-outline text-sm w-full"><X size={14} /> Reject</button>
                    </form>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
