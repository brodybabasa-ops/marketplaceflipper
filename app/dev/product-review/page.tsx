import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/guards";
import { isDevPreviewEnabled } from "@/lib/vision";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const metadata = { title: "Product review" };

const LINKS: [string, string][] = [
  ["Customer home", "/home"],
  ["My Garage", "/vehicles"],
  ["Add asset", "/vehicles/new"],
  ["Fix It", "/fix"],
  ["Inspect before buying", "/inspect"],
  ["Urgent help", "/help-now"],
  ["Provider matches", "/mechanics"],
  ["Jobs / repair tracking", "/jobs"],
  ["Estimates", "/estimates"],
  ["Payments / wallet", "/wallet"],
  ["Service history", "/history"],
  ["Messages", "/messages"],
  ["Fleet", "/fleet"],
  ["Profile", "/account"],
  ["Compare providers", "/compare"],
  ["Provider attention", "/mechanic"],
  ["Provider requests", "/mechanic/requests"],
  ["Provider jobs", "/mechanic/jobs"],
  ["Provider schedule", "/mechanic/schedule"],
  ["Provider CRM", "/mechanic/customers"],
  ["CRM today", "/mechanic/customers/today"],
  ["Provider job board", "/mechanic/board"],
  ["Provider settings", "/mechanic/settings"],
  ["HQ attention", "/admin"],
  ["Marketplace health", "/admin/marketplace"],
  ["Providers needed", "/admin/recruiting"],
  ["Verification", "/admin/verification"],
  ["Pocket Assurance", "/admin/disputes"],
  ["Role preview", "/dev/preview"],
];

const FLOW = [
  ["Customer", "Garage → Fix It → request → matches → request provider → job"],
  ["Authorization", "Grouped estimate → approve/decline items → immutable auth → supplemental v2"],
  ["Provider", "Request → accept → inspect → finding → estimate → repair → payment → CRM"],
  ["HQ", "Unserved / Assurance / failed pay / verification / stuck jobs"],
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
  const openRequest = session.role === "CUSTOMER"
    ? await prisma.serviceRequest.findFirst({
        where: { customerId: session.id, status: { in: ["OPEN", "MATCHED"] } },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
    : null;
  const extra = [
    firstAsset ? ["Asset home", `/vehicles/${firstAsset.vehicleId ?? firstAsset.id}`] : null,
    firstAsset ? ["Asset Fix It", `/fix?asset=${firstAsset.id}`] : null,
    openRequest ? ["Matches for open request", `/mechanics?request=${openRequest.id}`] : null,
    firstJob ? ["Job tracking", `/jobs/${firstJob.id}`] : null,
    firstJob ? ["Pay / complete", `/jobs/${firstJob.id}/pay`] : null,
    firstJob && session.role === "MECHANIC" ? ["Provider job", `/mechanic/jobs/${firstJob.id}`] : null,
  ].filter(Boolean) as [string, string][];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">Development only</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">Product review</h1>
      <p className="mt-2 text-sm text-muted">
        Signed in as {session.email}. This index is hidden when vision demo is off or NODE_ENV is production.
      </p>
      <Card className="mt-6 p-4">
        <p className="text-sm font-semibold text-ink">Canonical connected flow</p>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {FLOW.map(([label, body]) => (
            <li key={label}>
              <span className="font-semibold text-ink">{label}:</span> {body}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="mt-4 divide-y divide-line">
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
