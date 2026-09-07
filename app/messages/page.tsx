import Link from "next/link";
import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await requireSession();
  const threads = await prisma.messageThread.findMany({
    where: session.role === "MECHANIC" ? { mechanicId: session.id } : { customerId: session.id },
    include: {
      customer: true,
      mechanic: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      job: true,
    },
    orderBy: { lastMessageAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {session.role === "CUSTOMER" ? <AppNav items={CUSTOMER_NAV} current="/messages" /> : null}
      <h1 className="text-3xl font-bold text-ink">Messages</h1>
      <p className="mt-2 text-sm text-muted">Job-related conversations stay attached to the request, not a random phone number.</p>
      <div className="mt-6 space-y-3">
        {threads.length === 0 ? (
          <EmptyState title="No conversations yet" body="Start from a job or mechanic profile so the context stays with the work." />
        ) : (
          threads.map((thread) => {
            const other = session.id === thread.customerId ? thread.mechanic : thread.customer;
            return (
              <Link key={thread.id} href={thread.jobId ? `/jobs/${thread.jobId}` : `/messages/${thread.id}`} className="block rounded-2xl border border-line bg-card p-4">
                <p className="font-semibold text-ink">
                  {other.firstName} {other.lastName}
                </p>
                <p className="text-sm text-muted">{thread.messages[0]?.body}</p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
