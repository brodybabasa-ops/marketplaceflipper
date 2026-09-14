import Link from "next/link";
import { Plus, X } from "lucide-react";
import { ShopButton, ShopCard, ShopDelta, ShopEmpty, ShopKpi, ShopPageHeader, ShopPill, ShopTabs } from "@/components/shop-os/primitives";
import { vehiclePhotoFor } from "@/lib/landing";
import { formatCents } from "@/lib/money";
import { estimateExpired, shopEstimateChip, shopRoLabel } from "@/lib/shop-os";
import { formatBoardDate } from "@/lib/utils";
import type { EstimateLineCategory, EstimateStatus, EstimateType } from "@prisma/client";
import { ClipboardList, CheckCircle2, XCircle, Clock3, BarChart3 } from "lucide-react";

export type ShopEstimateRow = {
  id: string;
  status: EstimateStatus;
  type: EstimateType;
  totalCents: number;
  subtotalCents: number;
  notes: string | null;
  sentAt: Date | null;
  createdAt: Date;
  jobId: string;
  job: {
    repairOrderNumber: string | null;
    customer: { firstName: string; lastName: string; email: string; phone: string | null };
    vehicle: { year: number; make: { name: string }; model: { name: string }; photoUrl: string | null };
    serviceRequest: { problemText: string };
    thread: { id: string } | null;
  };
  lineItems: {
    id: string;
    category: EstimateLineCategory;
    description: string;
    quantity: number;
    unitCents: number;
    totalCents: number;
  }[];
};

export function ShopEstimatesBoard({
  estimates,
  selectedId,
  tab,
  q,
  kpis,
}: {
  estimates: ShopEstimateRow[];
  selectedId?: string;
  tab: "all" | "pending" | "approved" | "declined" | "expired";
  q?: string;
  kpis: {
    pending: number;
    pendingCents: number;
    approved: number;
    approvedCents: number;
    declined: number;
    declinedCents: number;
    expired: number;
    expiredCents: number;
    approvalRate: number;
    approvalDelta: number;
  };
}) {
  const selected = estimates.find((item) => item.id === selectedId) ?? estimates[0];
  const tabs = [
    { id: "all", label: "All Estimates", count: estimates.length },
    { id: "pending", label: "Pending", count: kpis.pending },
    { id: "approved", label: "Approved", count: kpis.approved },
    { id: "declined", label: "Declined", count: kpis.declined },
    { id: "expired", label: "Expired", count: kpis.expired },
  ] as const;
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader
        title="Estimates"
        subtitle="Create, send, and track estimates. Convert approved estimates to repair orders with one click."
        actions={
          <ShopButton href="/mechanic/jobs">
            <Plus className="h-4 w-4" /> New Estimate
          </ShopButton>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <ShopKpi icon={<ClipboardList className="h-5 w-5" />} label="Pending Approval" value={kpis.pending} hint={<span className="text-[#6b7c8d]">{formatCents(kpis.pendingCents)}</span>} tone="amber" />
        <ShopKpi icon={<CheckCircle2 className="h-5 w-5" />} label="Approved (30 days)" value={kpis.approved} hint={<span className="text-[#6b7c8d]">{formatCents(kpis.approvedCents)}</span>} tone="green" />
        <ShopKpi icon={<XCircle className="h-5 w-5" />} label="Declined (30 days)" value={kpis.declined} hint={<span className="text-[#6b7c8d]">{formatCents(kpis.declinedCents)}</span>} tone="amber" />
        <ShopKpi icon={<Clock3 className="h-5 w-5" />} label="Expired" value={kpis.expired} hint={<span className="text-[#6b7c8d]">{formatCents(kpis.expiredCents)}</span>} />
        <ShopKpi icon={<BarChart3 className="h-5 w-5" />} label="Approval Rate" value={`${kpis.approvalRate}%`} hint={<ShopDelta value={kpis.approvalDelta} suffix="from last month" />} tone="sky" />
      </div>
      <div className="mb-4">
        <ShopTabs
          items={tabs.map((item) => ({
            href: `/mechanic/estimates?tab=${item.id}`,
            label: item.label,
            count: item.count,
            active: tab === item.id,
          }))}
        />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ShopCard className="overflow-hidden">
          <form action="/mechanic/estimates" className="border-b border-[#eef3f8] px-3 py-3">
            <input type="hidden" name="tab" value={tab} />
            <input name="q" defaultValue={q} placeholder="Search estimates..." className="h-9 w-full rounded-xl border border-[#e6eef6] bg-[#f8fafc] px-3 text-sm outline-none" />
          </form>
          {estimates.length === 0 ? (
            <ShopEmpty title="No estimates yet" body="Send an estimate from a job and it lands here and on the customer board." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[13px]">
                <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#8a97a6]">
                  <tr>
                    <th className="px-4 py-2">Estimate #</th>
                    <th>Customer</th>
                    <th>Vehicle / Unit</th>
                    <th>Description</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th className="pr-4">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((estimate) => {
                    const expired = estimateExpired(estimate.sentAt, estimate.status);
                    const chip = shopEstimateChip(estimate.status, expired);
                    return (
                      <tr key={estimate.id} className={selected?.id === estimate.id ? "bg-[#eef4ff]" : "border-t border-[#eef3f8]"}>
                        <td className="px-4 py-3">
                          <Link href={`/mechanic/estimates?tab=${tab}&id=${estimate.id}`} className="font-bold text-[#2f7bff]">
                            {shopRoLabel(null, estimate.id).replace("#", "EST-")}
                          </Link>
                        </td>
                        <td className="font-semibold">
                          {estimate.job.customer.firstName} {estimate.job.customer.lastName}
                        </td>
                        <td>
                          {estimate.job.vehicle.year} {estimate.job.vehicle.make.name} {estimate.job.vehicle.model.name}
                        </td>
                        <td className="max-w-[160px] truncate text-[#5c6b7a]">{estimate.job.serviceRequest.problemText}</td>
                        <td className="font-semibold">{formatCents(estimate.totalCents)}</td>
                        <td>
                          <ShopPill label={chip.label} className={chip.className} />
                        </td>
                        <td className="text-[#6b7c8d]">{formatBoardDate(estimate.sentAt ?? estimate.createdAt)}</td>
                        <td className="pr-4 text-[#6b7c8d]">
                          {estimate.sentAt
                            ? formatBoardDate(new Date(estimate.sentAt.getTime() + 7 * 24 * 60 * 60 * 1000))
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ShopCard>
        {selected ? <EstimatePanel estimate={selected} /> : null}
      </div>
    </div>
  );
}

function EstimatePanel({ estimate }: { estimate: ShopEstimateRow }) {
  const expired = estimateExpired(estimate.sentAt, estimate.status);
  const chip = shopEstimateChip(estimate.status, expired);
  const photo = estimate.job.vehicle.photoUrl || vehiclePhotoFor(estimate.job.vehicle.make.name, estimate.job.vehicle.model.name);
  return (
    <ShopCard className="overflow-hidden">
      <div className="flex items-start justify-between border-b border-[#eef3f8] px-4 py-3">
        <div>
          <p className="font-extrabold">{shopRoLabel(null, estimate.id).replace("#", "EST-")}</p>
          <ShopPill label={chip.label} className={`${chip.className} mt-1`} />
          <p className="mt-1 text-[11px] text-[#8a97a6]">Created {formatBoardDate(estimate.createdAt)}</p>
        </div>
        <Link href="/mechanic/estimates" className="text-[#8a97a6]">
          <X className="h-4 w-4" />
        </Link>
      </div>
      <div className="max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto p-4">
        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="h-16 w-20 rounded-lg object-cover" />
          <div>
            <p className="font-extrabold">
              {estimate.job.vehicle.year} {estimate.job.vehicle.make.name} {estimate.job.vehicle.model.name}
            </p>
            <p className="text-sm">
              {estimate.job.customer.firstName} {estimate.job.customer.lastName}
            </p>
            <p className="text-[12px] text-[#6b7c8d]">
              {estimate.job.customer.phone ?? "No phone"} · {estimate.job.customer.email}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#8a97a6]">Estimate Details</p>
          <p className="mt-1 text-sm">{estimate.job.serviceRequest.problemText}</p>
          {estimate.notes ? <p className="mt-1 text-sm text-[#5c6b7a]">{estimate.notes}</p> : null}
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#8a97a6]">Line Items</p>
          <ul className="mt-2 divide-y divide-[#eef3f8] text-sm">
            {estimate.lineItems.map((item) => (
              <li key={item.id} className="flex justify-between gap-2 py-1.5">
                <span>
                  {item.description}
                  <span className="block text-[11px] text-[#8a97a6]">
                    {item.quantity} × {formatCents(item.unitCents)}
                  </span>
                </span>
                <span className="font-semibold">{formatCents(item.totalCents)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between text-[#6b7c8d]">
              <span>Subtotal</span>
              <span>{formatCents(estimate.subtotalCents || estimate.totalCents)}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold">
              <span>Total</span>
              <span>{formatCents(estimate.totalCents)}</span>
            </div>
          </div>
        </div>
        {estimate.status === "SENT" ? (
          <p className="rounded-xl bg-[#fff6d6] px-3 py-2 text-[13px] text-[#b45309]">
            Waiting on the customer to approve or decline. Approve/Decline lives on their job — this shop cannot accept on their behalf.
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          {estimate.job.thread ? (
            <ShopButton href={`/mechanic/messages/${estimate.job.thread.id}`} variant="secondary" className="text-xs">
              Request Changes
            </ShopButton>
          ) : (
            <ShopButton href="/mechanic/messages" variant="secondary" className="text-xs">
              Message customer
            </ShopButton>
          )}
          <ShopButton href={`/mechanic/jobs?job=${estimate.jobId}`} variant="secondary" className="text-xs">
            Convert to RO
          </ShopButton>
        </div>
        <ShopButton href={`/mechanic/jobs/${estimate.jobId}`} className="w-full">
          Open job
        </ShopButton>
      </div>
    </ShopCard>
  );
}
