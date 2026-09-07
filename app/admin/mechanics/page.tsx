import Link from "next/link";
import { AppNav, ADMIN_NAV } from "@/components/layout/app-nav";
import { requireSession } from "@/lib/guards";
import { staffRoles } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export const metadata = { title: "Mechanics" };

export default async function AdminMechanicsPage() {
  await requireSession(staffRoles());
  const mechanics = await prisma.mechanicProfile.findMany({
    include: { user: true },
    orderBy: { mechanicScore: "desc" },
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AppNav items={ADMIN_NAV} current="/admin/mechanics" />
      <h1 className="text-3xl font-bold text-ink">Mechanics</h1>
      <div className="mt-6 space-y-3">
        {mechanics.map((mechanic) => (
          <Link key={mechanic.id} href={`/mechanics/${mechanic.slug}`} className="block rounded-2xl border border-line bg-card p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{mechanic.businessName}</p>
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
