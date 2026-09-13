import { BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Mechanics" };

export default async function AdminMechanicsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireSession("ADMIN");
  const { q } = await searchParams;
  const term = q?.trim();
  const where: Prisma.MechanicProfileWhereInput = term
    ? {
        OR: [
          { businessName: { contains: term, mode: "insensitive" } },
          { slug: { contains: term, mode: "insensitive" } },
          { shopCity: { contains: term, mode: "insensitive" } },
          { user: { email: { contains: term, mode: "insensitive" } } },
          { user: { firstName: { contains: term, mode: "insensitive" } } },
          { user: { lastName: { contains: term, mode: "insensitive" } } },
        ],
      }
    : {};
  const mechanics = await prisma.mechanicProfile.findMany({
    where,
    include: { user: true },
    orderBy: { mechanicScore: "desc" },
  });
  return (
    <div className="space-y-3">
      {term ? <p className="text-sm text-muted">Showing matches for “{term}”.</p> : null}
      {mechanics.map((mechanic) => (
        <BoardLink key={mechanic.id} href={`/mechanics/${mechanic.slug}`}>
          <div className="flex justify-between gap-3">
            <div>
              <p className="font-semibold text-navy">{mechanic.businessName}</p>
              <p className="text-sm text-muted">
                {mechanic.user.email} · {mechanic.verificationLevel.toLowerCase().replaceAll("_", " ")} · score {mechanic.mechanicScore.toFixed(1)}
              </p>
            </div>
            <p className="text-sm text-muted">{mechanic.completedJobsCount} jobs</p>
          </div>
        </BoardLink>
      ))}
    </div>
  );
}
