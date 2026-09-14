import { Banknote, BarChart3, Briefcase, DollarSign } from "lucide-react";
import { ShopCard, ShopKpi, ShopPageHeader, ShopPill, ShopSectionTitle } from "@/components/shop-os/primitives";
import { formatCents } from "@/lib/money";
import { formatBoardDate } from "@/lib/utils";

export function ShopEarningsView({
  gross,
  commission,
  net,
  completedJobs,
  averageJob,
  payouts,
  topServices,
  monthly,
  commissionPercent,
}: {
  gross: number;
  commission: number;
  net: number;
  completedJobs: number;
  averageJob: number;
  commissionPercent: number;
  payouts: { id: string; amountCents: number; status: string; createdAt: Date; jobLabel?: string }[];
  topServices: { label: string; jobs: number; revenue: number }[];
  monthly: { label: string; cents: number }[];
}) {
  const max = Math.max(...monthly.map((item) => item.cents), 1);
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader
        title="Earnings"
        subtitle="Track your revenue, payouts, and financial performance all in one place."
      />
      <div className="mb-4 flex gap-2 text-[13px] font-semibold">
        <span className="rounded-full bg-[#e8f1ff] px-3 py-1 text-[#2f7bff]">Overview</span>
        <span className="rounded-full px-3 py-1 text-[#6b7c8d]">Payouts</span>
        <span className="rounded-full px-3 py-1 text-[#6b7c8d]">Invoices</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ShopKpi icon={<DollarSign className="h-5 w-5" />} label="Total Revenue" value={formatCents(gross)} />
        <ShopKpi icon={<Briefcase className="h-5 w-5" />} label="Completed Jobs" value={completedJobs} tone="sky" />
        <ShopKpi icon={<BarChart3 className="h-5 w-5" />} label="Average Job Value" value={formatCents(averageJob)} tone="amber" />
        <ShopKpi icon={<Banknote className="h-5 w-5" />} label="Net Payout (After Fees)" value={formatCents(net)} tone="green" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_320px]">
        <ShopCard className="p-4">
          <p className="font-bold">Revenue Overview</p>
          <div className="mt-4 flex h-48 items-end gap-2">
            {monthly.map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end rounded-t-md bg-[#eef4ff]">
                  <div className="w-full rounded-t-md bg-[#2f7bff]" style={{ height: `${Math.max(8, (item.cents / max) * 100)}%` }} />
                </div>
                <span className="text-[11px] font-semibold text-[#8a97a6]">{item.label}</span>
              </div>
            ))}
          </div>
        </ShopCard>
        <ShopCard className="p-4">
          <p className="font-bold">Earnings Breakdown</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Total Job Revenue</dt>
              <dd className="font-bold">{formatCents(gross)}</dd>
            </div>
            <div className="flex justify-between text-[#c4453c]">
              <dt>Platform Fee ({commissionPercent}%)</dt>
              <dd>-{formatCents(commission)}</dd>
            </div>
            <div className="flex justify-between border-t border-[#eef3f8] pt-2 text-base font-extrabold">
              <dt>Net Payout</dt>
              <dd>{formatCents(net)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] text-[#6b7c8d]">
            Paid jobs settle on the job record. Stripe Connect will move these same totals when keys are added; until then checkout uses the mock processor.
          </p>
        </ShopCard>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ShopCard>
          <ShopSectionTitle title="Recent Payouts" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-[#8a97a6]">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="pr-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-[#6b7c8d]" colSpan={4}>
                      Payouts appear after paid jobs. Until Connect is live, this is the shop net after commission.
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout.id} className="border-t border-[#eef3f8]">
                      <td className="px-4 py-3">{formatBoardDate(payout.createdAt)}</td>
                      <td className="font-semibold">{formatCents(payout.amountCents)}</td>
                      <td>
                        <ShopPill
                          label={payout.status === "PAID" ? "Paid" : payout.status.toLowerCase()}
                          className={payout.status === "PAID" ? "bg-[#e7f8ee] text-[#15803d]" : "bg-[#fff6d6] text-[#b45309]"}
                        />
                      </td>
                      <td className="pr-4 text-[#6b7c8d]">{payout.jobLabel ?? "ACH Transfer"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ShopCard>
        <ShopCard>
          <ShopSectionTitle title="Top Performing Services" />
          <ul className="space-y-2 px-4 pb-4">
            {topServices.length === 0 ? (
              <li className="text-sm text-[#6b7c8d]">Completed jobs will rank services here.</li>
            ) : (
              topServices.map((item) => (
                <li key={item.label} className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2 text-sm">
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className="text-[11px] text-[#8a97a6]">{item.jobs} jobs</span>
                  </span>
                  <span className="font-bold">{formatCents(item.revenue)}</span>
                </li>
              ))
            )}
          </ul>
        </ShopCard>
      </div>
    </div>
  );
}
