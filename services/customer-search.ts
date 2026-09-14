import { prisma } from "@/lib/db";
import { jobSearchWhere } from "@/services/jobs";

export async function searchCustomerWorkspace(customerId: string, q: string) {
  const term = q.trim();
  if (!term) {
    return { shops: [], vehicles: [], jobs: [], threads: [] };
  }

  const [shops, vehicles, jobs, threads] = await Promise.all([
    prisma.mechanicProfile.findMany({
      where: {
        user: { status: "ACTIVE" },
        OR: [
          { businessName: { contains: term, mode: "insensitive" } },
          { tagline: { contains: term, mode: "insensitive" } },
          { bio: { contains: term, mode: "insensitive" } },
          { shopCity: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { mechanicScore: "desc" },
      take: 8,
    }),
    prisma.vehicle.findMany({
      where: {
        customerId,
        archivedAt: null,
        OR: [
          { nickname: { contains: term, mode: "insensitive" } },
          { vin: { contains: term, mode: "insensitive" } },
          { make: { name: { contains: term, mode: "insensitive" } } },
          { model: { name: { contains: term, mode: "insensitive" } } },
          ...(Number.isInteger(Number(term)) ? [{ year: Number(term) }] : []),
        ],
      },
      include: { make: true, model: true },
      take: 8,
    }),
    prisma.job.findMany({
      where: { customerId, AND: [jobSearchWhere(term)] },
      include: {
        serviceRequest: true,
        mechanicProfile: true,
        vehicle: { include: { make: true, model: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.messageThread.findMany({
      where: {
        customerId,
        OR: [
          { mechanic: { mechanicProfile: { businessName: { contains: term, mode: "insensitive" } } } },
          { messages: { some: { body: { contains: term, mode: "insensitive" } } } },
          { job: { serviceRequest: { problemText: { contains: term, mode: "insensitive" } } } },
        ],
      },
      include: {
        mechanic: { include: { mechanicProfile: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        job: { include: { serviceRequest: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 8,
    }),
  ]);

  return { shops, vehicles, jobs, threads };
}
