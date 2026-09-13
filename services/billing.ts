import { prisma } from "@/lib/db";
import { nextInvoiceNumber } from "@/lib/document-numbers";
import { formatCents } from "@/lib/money";
import { notify } from "@/services/notifications";
import { getPaymentService } from "@/services/payment";

export async function persistRepairHistory(jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      vehicle: true,
      serviceRequest: true,
      estimates: { where: { status: "APPROVED" }, include: { lineItems: true }, orderBy: { createdAt: "desc" } },
      repairRecord: true,
    },
  });
  if (job.repairRecord) return;
  const approved = job.estimates[0];
  const parts = approved?.lineItems.filter((item) => item.category === "PARTS").map((item) => item.description) ?? [];
  const laborHours = approved?.lineItems
    .filter((item) => item.category === "LABOR" || item.category === "DIAGNOSTIC")
    .reduce((sum, item) => sum + item.quantity, 0);
  await prisma.repairRecord.create({
    data: {
      jobId,
      vehicleId: job.vehicleId,
      title: job.serviceRequest.problemText,
      diagnosis: job.serviceRequest.description || job.serviceRequest.problemText,
      workPerformed: approved ? approved.lineItems.map((item) => item.description).join("; ") : job.serviceRequest.problemText,
      partsReplaced: parts.length ? parts.join(", ") : undefined,
      laborHours: laborHours || undefined,
      mileage: job.vehicle.mileage,
      warrantySummary: "12 months / 12,000 miles",
    },
  });
}

export async function issueInvoiceForJob(jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      invoice: true,
      estimates: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const totalCents = job.estimates[0]?.totalCents || job.totalCents;
  if (job.invoice) {
    if (job.invoice.status === "VOID") return job.invoice;
    if (job.paymentStatus === "UNPAID") {
      await prisma.job.update({
        where: { id: jobId },
        data: { paymentStatus: totalCents > 0 ? "PENDING" : "PAID", totalCents },
      });
    }
    return job.invoice;
  }

  const invoice = await prisma.invoice.create({
    data: {
      jobId,
      number: await nextInvoiceNumber(),
      status: totalCents > 0 ? "ISSUED" : "PAID",
      subtotalCents: totalCents,
      totalCents,
      paidAt: totalCents > 0 ? undefined : new Date(),
    },
  });
  await prisma.job.update({
    where: { id: jobId },
    data: {
      totalCents,
      paymentStatus: totalCents > 0 ? "PENDING" : "PAID",
    },
  });
  if (totalCents > 0) {
    await notify({
      userId: job.customerId,
      title: "Invoice ready",
      body: `Pay ${formatCents(totalCents)} to close out this repair.`,
      href: `/jobs/${jobId}#invoice`,
    });
  }
  return invoice;
}

export async function payJobInvoice(jobId: string, customerId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { invoice: true, mechanicProfile: true },
  });
  if (job.customerId !== customerId) throw new Error("Not authorized.");
  if (job.status !== "COMPLETED") throw new Error("Pay after the shop marks the repair complete.");
  if (job.paymentStatus === "PAID") return job.invoice;
  const invoice = job.invoice ?? (await issueInvoiceForJob(jobId));
  if (invoice.status === "PAID") {
    await prisma.job.update({ where: { id: jobId }, data: { paymentStatus: "PAID" } });
    return invoice;
  }

  const payments = getPaymentService();
  const intent = await payments.createPaymentIntent({
    amountCents: invoice.totalCents,
    jobId,
    customerId,
  });
  const captured = await payments.capture(intent.id);
  if (captured.status !== "succeeded") throw new Error("Payment did not go through.");

  const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
  const commissionPercent = job.commissionPercent ?? config?.commissionPercent ?? 10;
  const commissionCents = Math.round(invoice.totalCents * (commissionPercent / 100));

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentIntentId: captured.id,
      },
    }),
    prisma.job.update({
      where: { id: jobId },
      data: {
        paymentStatus: "PAID",
        paymentIntentId: captured.id,
        commissionPercent,
        totalCents: invoice.totalCents,
      },
    }),
    prisma.payout.create({
      data: {
        mechanicUserId: job.mechanicUserId,
        jobId,
        amountCents: invoice.totalCents - commissionCents,
        commissionCents,
        status: "PENDING",
      },
    }),
  ]);

  await persistRepairHistory(jobId);
  await notify({
    userId: job.mechanicUserId,
    title: "Payment received",
    body: `${formatCents(invoice.totalCents)} paid on ${invoice.number}.`,
    href: `/mechanic/jobs/${jobId}`,
  });
  return prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
}
