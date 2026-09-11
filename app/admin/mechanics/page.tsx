import Link from "next/link";
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
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold text-navy">Mechanics</h1>
      <div className="mt-6 space-y-3">
        {mechanics.map((mechanic) => (
          <Link key={mechanic.id} href={`/mechanics/${mechanic.slug}`} className="block rounded-2xl border border-line bg-white p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">{mechanic.businessName}</p>
                <p className="text-sm text-muted">
                  {mechanic.user.email} · {mechanic.verificationLevel} · score {mechanic.mechanicScore.toFixed(1)}
                </p>
              </div>
              <p className="text-sm text-muted">{mechanic.completedJobsCount} jobs</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
