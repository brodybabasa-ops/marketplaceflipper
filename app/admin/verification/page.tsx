import { AppNav, ADMIN_NAV } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { reviewVerificationAction } from "@/app/actions/admin";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Verification" };

export default async function AdminVerificationPage() {
  await requireSession("ADMIN");
  const items = await prisma.verification.findMany({
    include: { mechanic: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AppNav items={ADMIN_NAV} current="/admin/verification" />
      <h1 className="text-3xl font-bold text-navy">Verification queue</h1>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold text-navy">
              {item.mechanic.businessName} · {item.level}
            </p>
            <p className="text-sm text-muted">
              {item.mechanic.user.email} · {item.status}
            </p>
            {item.status === "PENDING" ? (
              <form action={reviewVerificationAction} className="mt-3 flex gap-2">
                <input type="hidden" name="verificationId" value={item.id} />
                <Button name="status" value="APPROVED" size="sm">
                  Approve
                </Button>
                <Button name="status" value="REJECTED" size="sm" variant="secondary">
                  Reject
                </Button>
              </form>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
