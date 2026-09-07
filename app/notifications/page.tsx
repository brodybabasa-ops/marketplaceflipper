import Link from "next/link";
import { CustomerAppNav, MechanicAppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { markNotificationsReadAction } from "@/app/actions/phase2";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await requireSession();
  const items = await prisma.notification.findMany({
    where: { userId: session.id, channel: "IN_APP" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {session.role === "MECHANIC" ? <MechanicAppNav current="/notifications" /> : <CustomerAppNav current="/notifications" />}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-ink">Notifications</h1>
        <form action={markNotificationsReadAction}>
          <Button type="submit" variant="secondary" size="sm">
            Mark all read
          </Button>
        </form>
      </div>
      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <EmptyState title="You're caught up" body="Job updates, estimates, and messages will show up here. Email and SMS follow the preferences in your profile." />
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href ?? "#"}
              className={`block rounded-2xl border border-line p-4 ${item.readAt ? "bg-card" : "bg-accent-soft"}`}
            >
              <p className="font-semibold text-ink">{item.title}</p>
              <p className="text-sm text-muted">{item.body}</p>
              <p className="mt-1 text-xs text-muted">{item.createdAt.toLocaleString()}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
