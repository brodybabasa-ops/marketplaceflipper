import { payInvoiceAction } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import type { InvoiceStatus, PaymentStatus } from "@prisma/client";

export function InvoiceCard({
  jobId,
  invoice,
  paymentStatus,
  repairOrderNumber,
  canPay,
  audience = "customer",
}: {
  jobId: string;
  invoice: {
    number: string;
    status: InvoiceStatus;
    totalCents: number;
    issuedAt: Date;
    paidAt: Date | null;
  } | null;
  paymentStatus: PaymentStatus;
  repairOrderNumber: string | null;
  canPay: boolean;
  audience?: "customer" | "shop";
}) {
  const paid = paymentStatus === "PAID" || invoice?.status === "PAID";
  const total = invoice?.totalCents ?? 0;
  return (
    <Card
      id="invoice"
      className={
        audience === "shop"
          ? "scroll-mt-28 border-0 p-5"
          : "scroll-mt-28 border-0 bg-[#f7f9fc] p-5 shadow-none"
      }
    >
      <h2 className="font-semibold text-navy">Invoice</h2>
      {repairOrderNumber ? <p className="mt-1 text-sm text-muted">Repair order {repairOrderNumber}</p> : null}
      {invoice ? (
        <>
          <p className="mt-2 text-lg font-semibold text-navy">{invoice.number}</p>
          <p className="number mt-1 text-2xl font-semibold">{formatCents(total)}</p>
          <p className="mt-1 text-sm text-muted">
            {paid
              ? `Paid ${invoice.paidAt ? invoice.paidAt.toLocaleDateString("en-US") : ""}`.trim()
              : "Awaiting payment"}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">
          {audience === "shop"
            ? "Mark the job complete to issue an invoice from the approved estimate."
            : "The shop invoice appears here when the repair is complete."}
        </p>
      )}
      {canPay && invoice && !paid && total > 0 ? (
        <form action={payInvoiceAction} className="mt-4">
          <input type="hidden" name="jobId" value={jobId} />
          <Button type="submit" name="payInvoice">
            Pay {formatCents(total)}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
