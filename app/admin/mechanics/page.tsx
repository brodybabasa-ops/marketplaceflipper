import { BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Mechanics" };

export default async function AdminMechanicsPage() {
  await requireSession("ADMIN");
  const mechanics = await prisma.mechanicProfile.findMany({
    include: { user: true },
    orderBy: { mechanicScore: "desc" },
  });
  return (
    <div className="space-y-3">
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
