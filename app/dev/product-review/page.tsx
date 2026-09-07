import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/guards";
import { isDevPreviewEnabled } from "@/lib/vision";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const metadata = { title: "Product review" };

const LINKS = [
  ["Customer home", "/home"],
  ["My Garage", "/vehicles"],
  ["Fix It", "/fix"],
  ["Inspect before buying", "/inspect"],
  ["Urgent help", "/help-now"],
  ["Jobs", "/jobs"],
  ["Estimates", "/estimates"],
  ["History", "/history"],
  ["Fleet", "/fleet"],
  ["Wallet", "/wallet"],
  ["Profile", "/account"],
  ["Find a mechanic", "/mechanics"],
  ["Compare", "/compare"],
  ["Provider attention", "/mechanic"],
  ["Provider schedule", "/mechanic/schedule"],
  ["Provider settings", "/mechanic/settings"],
  ["Provider CRM", "/mechanic/customers"],
  ["Provider job board", "/mechanic/board"],
  ["HQ attention", "/admin"],
  ["Marketplace", "/admin/marketplace"],
  ["Providers needed", "/admin/recruiting"],
  ["Verification", "/admin/verification"],
  ["Pocket Assurance", "/admin/disputes"],
  ["Role preview", "/dev/preview"],
];

export default async function ProductReviewPage() {
  if (!isDevPreviewEnabled()) notFound();
  const session = await requireSession();
  const firstAsset = session.role === "CUSTOMER"
    ? await prisma.asset.findFirst({ where: { ownerId: session.id }, select: { id: true, vehicleId: true } })
    : null;
  const firstJob = await prisma.job.findFirst({
    where: session.role === "MECHANIC" ? { mechanicUserId: session.id } : { customerId: session.id },
    select: { id: true },
  });
  const extra = [
    firstAsset ? ["Asset home", `/vehicles/${firstAsset.vehicleId ?? firstAsset.id}`] : null,
    firstJob ? ["Job tracking", `/jobs/${firstJob.id}`] : null,
    firstJob && session.role === "MECHANIC" ? ["Provider job", `/mechanic/jobs/${firstJob.id}`] : null,
  ].filter(Boolean) as [string, string][];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">Development only</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">Product review</h1>
      <p className="mt-2 text-sm text-muted">
        Signed in as {session.email}. This index is hidden when vision demo is off or NODE_ENV is production.
      </p>
      <Card className="mt-6 divide-y divide-line">
        {[...LINKS, ...extra].map(([label, href]) => (
          <Link key={href} href={href} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate">
            <span>{label}</span>
            <span className="text-muted">{href}</span>
          </Link>
        ))}
      </Card>
    </div>
  );
}
