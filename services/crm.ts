import { jobAssetLabel } from "@/lib/asset-display";
import { prisma } from "@/lib/db";

export async function getMechanicCrm(mechanicProfileId: string, mechanicUserId: string, query?: string) {
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId },
    include: { customer: true, vehicle: { include: { make: true, model: true } }, asset: true, payments: true, serviceRequest: true },
    orderBy: { updatedAt: "desc" },
  });
  const recommended = await prisma.recommendedWork.findMany({
    where: { mechanicProfileId, status: "OPEN" },
    include: { customer: true, vehicle: { include: { make: true, model: true } } },
  });

  const byCustomer = new Map<string, (typeof jobs)[number][]>();
  for (const job of jobs) {
    const list = byCustomer.get(job.customerId) ?? [];
    list.push(job);
    byCustomer.set(job.customerId, list);
  }

  const customers = [...byCustomer.entries()].map(([id, customerJobs]) => {
    const person = customerJobs[0].customer;
    const completed = customerJobs.filter((job) => job.status === "COMPLETED");
    const spend = completed.reduce((sum, job) => sum + job.totalCents, 0);
    const last = customerJobs[0];
    const rec = recommended.filter((item) => item.customerId === id);
    const unpaid = customerJobs.some((job) => job.status === "COMPLETED" && job.paymentStatus !== "PAID");
    let nextAction = "None";
    if (unpaid) nextAction = "Unpaid invoice";
    else if (rec[0]) nextAction = rec[0].title;
    else if (customerJobs.some((job) => job.status === "AWAITING_APPROVAL")) nextAction = "Estimate pending";
    return {
      id,
      name: `${person.firstName} ${person.lastName}`,
      email: person.email,
      phone: person.phone,
      vehicles: [...new Set(customerJobs.map((job) => jobAssetLabel(job)))],
      lastVisit: last.completedAt ?? last.updatedAt,
      nextAction,
      lifetimeSpendCents: spend,
      completedJobs: completed.length,
      averageRoCents: completed.length ? Math.round(spend / completed.length) : 0,
      recommended: rec,
      jobs: customerJobs,
    };
  });

  const q = query?.trim().toLowerCase();
  const filtered = q
    ? customers.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.vehicles.some((vehicle) => vehicle.toLowerCase().includes(q)),
      )
    : customers;

  const potential = recommended.reduce((sum, item) => sum + item.estimatedCents, 0);
  return {
    customers: filtered,
    recommended,
    attention: {
      recommended: recommended.length,
      unpaid: customers.filter((item) => item.nextAction === "Unpaid invoice").length,
      estimates: customers.filter((item) => item.nextAction === "Estimate pending").length,
      potential,
    },
    mechanicUserId,
  };
}
