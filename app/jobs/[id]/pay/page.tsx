import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerAppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { payJobAction } from "@/app/actions/phase2";
import { requireSession } from "@/lib/guards";
import { getJobPaymentSummary } from "@/services/checkout";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Pay for repair" };

export default async function PayJobPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession("CUSTOMER");
  const { id } = await params;
  const summary = await getJobPaymentSummary(id);
  if (summary.job.customerId !== session.id) notFound();
  const alreadyPaid = summary.job.paymentStatus === "PAID";

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <CustomerAppNav current="/jobs" />
      <h1 className="text-3xl font-bold text-ink">Pay for this repair</h1>
      <p className="mt-2 text-sm text-muted">
        You pay the approved estimate. Pocket Mechanic’s marketplace fee comes out of the mechanic payout, not as an extra charge on your bill.
      </p>
      <Card className="mt-6 space-y-3 p-5">
        <div className="flex justify-between text-sm">
          <span>Approved total</span>
          <span className="number font-semibold">{formatCents(summary.amountCents)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted">
          <span>Platform fee ({summary.commissionPercent}%) — paid by mechanic</span>
          <span className="number">{formatCents(summary.commissionCents)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted">
          <span>{summary.job.mechanicProfile.businessName} receives</span>
          <span className="number">{formatCents(summary.mechanicPayoutCents)}</span>
        </div>
        <p className="text-xs text-muted">
          {process.env.STRIPE_SECRET_KEY
            ? "Charged through Stripe Connect."
            : "Demo mode: this completes a mock Stripe Connect charge. No real card is collected or stored."}
        </p>
        <p className="text-xs text-muted">
          Repair financing, if offered later, is through integrated regulated partners. Pocket Mechanic is not the lender.
        </p>
      </Card>
      {alreadyPaid ? (
        <p className="mt-6 text-sm text-success">This job is already paid.</p>
      ) : (
        <form action={payJobAction} className="mt-6">
          <input type="hidden" name="jobId" value={id} />
          <Button type="submit" size="lg" className="w-full">
            Pay {formatCents(summary.amountCents)}
          </Button>
        </form>
      )}
      <Link href={`/jobs/${id}`} className="mt-4 inline-block text-sm font-semibold text-ink">
        Back to job
      </Link>
    </div>
  );
}
