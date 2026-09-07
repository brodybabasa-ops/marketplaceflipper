import { HqAppNav } from "@/components/layout/app-nav";
import { requireSession } from "@/lib/guards";
import { staffRoles } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Support" };

export default async function HqSupportPage() {
  await requireSession(staffRoles());
  const tickets = await prisma.supportTicket.findMany({
    include: { requester: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return (
    <div>
      <HqAppNav current="/admin/support" />
      <h1 className="text-3xl font-bold text-ink">Support</h1>
      <p className="mt-2 text-sm text-muted">Jump from a ticket to the customer, provider, or job record.</p>
      <div className="mt-6 space-y-3">
        {tickets.length === 0 ? <p className="text-muted">No tickets in the queue.</p> : null}
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="p-4">
            <p className="font-semibold">{ticket.topic}</p>
            <p className="text-sm text-muted">
              {ticket.requester.email} · {ticket.status}
            </p>
            <p className="mt-2 text-sm">{ticket.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
