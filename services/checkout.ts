import { prisma } from "@/lib/db";
import { notifyUser } from "@/services/notifications";
import { getPaymentService } from "@/services/payment";
import type { PaymentStatus } from "@prisma/client";

export function splitMarketplaceAmount(amountCents: number, commissionPercent: number) {
  const commissionCents = Math.round(amountCents * (commissionPercent / 100));
  return {
    amountCents,
    commissionCents,
    mechanicPayoutCents: amountCents - commissionCents,
  };
}

export async function getJobPaymentSummary(jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { mechanicProfile: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
  const commissionPercent = job.commissionPercent ?? config?.commissionPercent ?? 10;
  return {
    job,
    ...splitMarketplaceAmount(job.totalCents, commissionPercent),
    commissionPercent,
    latest: job.payments[0] ?? null,
  };
}

export async function chargeJob(input: { jobId: string; customerId: string }) {
  const summary = await getJobPaymentSummary(input.jobId);
  const job = summary.job;
  if (job.customerId !== input.customerId) throw new Error("Not authorized.");
  if (job.totalCents <= 0) throw new Error("This job does not have an approved amount to pay.");
  if (job.paymentStatus === "PAID") throw new Error("This job is already paid.");
  if (job.status === "CANCELLED") throw new Error("Cancelled jobs cannot be paid.");
  if (job.status !== "COMPLETED" && job.status !== "DISPUTED") {
    throw new Error("Pay after the work is complete.");
  }

  const service = getPaymentService();
  const intent = await service.createPaymentIntent({
    amountCents: summary.amountCents,
    jobId: job.id,
    customerId: job.customerId,
    connectAccountId: job.mechanicProfile.stripeConnectAccountId,
    applicationFeeCents: summary.commissionCents,
  });

  const captured = await service.capture(intent.id);
  const status: PaymentStatus = captured.status === "succeeded" ? "PAID" : captured.status === "canceled" ? "FAILED" : "PENDING";

  const payment = await prisma.payment.create({
    data: {
      jobId: job.id,
      customerId: job.customerId,
      mechanicUserId: job.mechanicUserId,
      amountCents: summary.amountCents,
      commissionCents: summary.commissionCents,
      mechanicPayoutCents: summary.mechanicPayoutCents,
      status,
      provider: process.env.STRIPE_SECRET_KEY ? "stripe" : "mock",
      providerIntentId: captured.id,
    },
  });

  if (status === "PAID") {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        paymentStatus: "PAID",
        paymentIntentId: captured.id,
        commissionPercent: summary.commissionPercent,
      },
    });
    await prisma.payout.create({
      data: {
        mechanicUserId: job.mechanicUserId,
        jobId: job.id,
        amountCents: summary.mechanicPayoutCents,
        commissionCents: summary.commissionCents,
        status: "PAID",
        stripeConnectAccountId: job.mechanicProfile.stripeConnectAccountId,
        stripeTransferId: captured.id,
      },
    });
    await notifyUser({
      userId: job.mechanicUserId,
      title: "Payment received",
      body: "The customer paid for this job. Your payout is recorded.",
      href: `/mechanic/earnings`,
    });
    await notifyUser({
      userId: job.customerId,
      title: "Payment complete",
      body: "Your receipt is saved with the job and repair record.",
      href: `/jobs/${job.id}`,
    });
  }

  return payment;
}

export async function connectMechanicPayouts(mechanicUserId: string) {
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: mechanicUserId } });
  const account = await getPaymentService().createConnectedAccount(mechanicUserId);
  return prisma.mechanicProfile.update({
    where: { id: profile.id },
    data: {
      stripeConnectAccountId: account.id,
      stripeChargesEnabled: account.chargesEnabled,
    },
  });
}
