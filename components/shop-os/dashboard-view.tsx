import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DollarSign,
  FileText,
  MessageSquare,
  Package,
  Plus,
  UserPlus,
  Wrench,
} from "lucide-react";
import { ShopDayBoard } from "@/components/shop-os/boards";
import { ShopButton, ShopCard, ShopDelta, ShopKpi, ShopPageHeader, ShopPill, ShopSectionTitle } from "@/components/shop-os/primitives";
import { formatCents } from "@/lib/money";
import { shopDateLabel, shopGreeting, shopJobChip, shopRoLabel } from "@/lib/shop-os";
import { formatRelative } from "@/lib/utils";
import type { SchedulerHoldCard, SchedulerJobCard, SchedulerResourceCard } from "@/lib/scheduler";
import type { JobStatus } from "@prisma/client";

export type DashboardJob = {
  id: string;
  status: JobStatus;
  repairOrderNumber: string | null;
  scheduledAt: Date | null;
  totalCents: number;
  customer: { firstName: string; lastName: string };
  vehicle: { year: number; make: { name: string }; model: { name: string } };
  serviceRequest: { problemText: string };
  resourceName?: string | null;
};

export type DashboardActivity = {
  id: string;
  title: string;
  detail: string;
  href: string;
  at: Date;
};

export function ShopDashboard({
  firstName,
  kpis,
  todayJobs,
  todayHolds,
  resources,
  todayDate,
  attention,
  activeJobs,
  activity,
}: {
  firstName: string;
  kpis: {
    activeRepairs: number;
    activeDelta: number;
    estimatesPending: number;
    estimatesValue: number;
    jobsCompleted: number;
    completedDelta: number;
    revenueToday: number;
    revenueDelta: number;
    billedHours: number;
    billedTarget: number;
  };
  todayJobs: SchedulerJobCard[];
  todayHolds: SchedulerHoldCard[];
  resources: SchedulerResourceCard[];
  todayDate: string;
  attention: { overdue: number; estimates: number; parts: number; unread: number; comebacks: number };
  activeJobs: DashboardJob[];
  activity: DashboardActivity[];
}) {
  const billedPct = Math.min(100, Math.round((kpis.billedHours / Math.max(kpis.billedTarget, 1)) * 100));
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader
        title={`${shopGreeting()}, ${firstName}!`}
        subtitle="Here's what's happening at the shop today."
        actions={
          <>
            <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e6eef6] bg-white px-3 text-sm font-semibold text-[#5c6b7a]">
              <Calendar className="h-4 w-4 text-[#2f7bff]" />
              {shopDateLabel()}
            </span>
            <ShopButton href="/mechanic/jobs/new">
              <Plus className="h-4 w-4" /> New Repair
            </ShopButton>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <ShopKpi
          icon={<Wrench className="h-5 w-5" />}
          label="Active Repairs"
          value={kpis.activeRepairs}
          hint={<ShopDelta value={kpis.activeDelta} />}
        />
        <ShopKpi
          icon={<ClipboardList className="h-5 w-5" />}
          label="Estimates Pending"
          value={kpis.estimatesPending}
          hint={<span className="text-[#6b7c8d]">{formatCents(kpis.estimatesValue)}</span>}
          tone="amber"
        />
        <ShopKpi
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Jobs Completed"
          value={kpis.jobsCompleted}
          hint={<ShopDelta value={kpis.completedDelta} />}
          tone="green"
        />
        <ShopKpi
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue (Today)"
          value={formatCents(kpis.revenueToday)}
          hint={<ShopDelta value={kpis.revenueDelta} />}
          tone="navy"
        />
        <ShopCard className="p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef6ff] text-[#2563eb]">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[12px] font-medium text-[#6b7c8d]">Billed Hours (MTD)</p>
              <p className="mt-0.5 text-[26px] font-extrabold leading-none text-[#102033]">{kpis.billedHours.toFixed(1)}</p>
              <p className="mt-1.5 text-[11px] font-semibold text-[#6b7c8d]">
                {billedPct}% of target ({kpis.billedTarget} hrs)
              </p>
              <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-[#e8f1ff]">
                <div className="h-full rounded-full bg-[#2f7bff]" style={{ width: `${billedPct}%` }} />
              </div>
            </div>
          </div>
        </ShopCard>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <ShopCard className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <h2 className="text-[15px] font-bold text-[#102033]">Today&apos;s Schedule</h2>
            <div className="flex items-center gap-2">
              <Link href={`/mechanic/schedule?view=day&date=${todayDate}`} className="rounded-lg bg-[#2f7bff] px-3 py-1 text-[12px] font-semibold text-white">
                Day
              </Link>
              <Link href={`/mechanic/schedule?view=week&date=${todayDate}`} className="rounded-lg px-3 py-1 text-[12px] font-semibold text-[#5c6b7a]">
                Week
              </Link>
              <ShopButton href="/mechanic/jobs/new" variant="ghost" className="h-8">
                <Plus className="h-3.5 w-3.5" /> Add
              </ShopButton>
            </div>
          </div>
          <div className="px-2 pb-3">
            {resources.length === 0 ? (
              <p className="px-3 py-8 text-sm text-[#6b7c8d]">Add technicians on Team to see the day board.</p>
            ) : (
              <ShopDayBoard date={todayDate} resources={resources} jobs={todayJobs} holds={todayHolds} />
            )}
          </div>
        </ShopCard>
        <div className="space-y-4">
          <ShopCard>
            <ShopSectionTitle title="Needs Attention" href="/mechanic/jobs" />
            <div className="space-y-1 px-3 pb-3">
              <AttentionRow href="/mechanic/jobs?tab=progress" icon={<AlertTriangle className="h-4 w-4 text-[#e23d3d]" />} label="Overdue Repairs" count={attention.overdue} detail="Past promised date" />
              <AttentionRow href="/mechanic/estimates?tab=pending" icon={<ClipboardList className="h-4 w-4 text-[#d97706]" />} label="Estimates Pending" count={attention.estimates} detail="Customer approval needed" />
              <AttentionRow href="/mechanic/jobs?tab=parts" icon={<Package className="h-4 w-4 text-[#2f7bff]" />} label="Waiting on Parts" count={attention.parts} detail="Parts on order" />
              <AttentionRow href="/mechanic/messages" icon={<MessageSquare className="h-4 w-4 text-[#7b4fd4]" />} label="Unread Messages" count={attention.unread} detail="From customers" />
              <AttentionRow href="/mechanic/jobs?tab=hold" icon={<Clock3 className="h-4 w-4 text-[#c4453c]" />} label="Comebacks" count={attention.comebacks} detail="Disputes or rework" />
            </div>
          </ShopCard>
          <ShopCard className="p-4">
            <p className="text-[15px] font-bold text-[#102033]">Quick Actions</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <QuickAction href="/mechanic/jobs/new" icon={<Wrench className="h-4 w-4" />} label="New Repair" />
              <QuickAction href="/mechanic/jobs" icon={<FileText className="h-4 w-4" />} label="New Estimate" />
              <QuickAction href="/mechanic/customers" icon={<UserPlus className="h-4 w-4" />} label="Add Customer" />
              <QuickAction href="/mechanic/schedule" icon={<Calendar className="h-4 w-4" />} label="Schedule Job" />
              <QuickAction href="/mechanic/inventory" icon={<Package className="h-4 w-4" />} label="Order Parts" />
              <QuickAction href="/mechanic/invoicing" icon={<DollarSign className="h-4 w-4" />} label="Create Invoice" />
              <QuickAction href="/mechanic/messages" icon={<Bell className="h-4 w-4" />} label="Send Message" />
              <QuickAction href="/mechanic/reports" icon={<BarChart3 className="h-4 w-4" />} label="View Reports" />
            </div>
          </ShopCard>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_260px]">
        <ShopCard className="overflow-hidden">
          <ShopSectionTitle title="Active Repairs" href="/mechanic/jobs" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead className="text-[11px] font-semibold uppercase tracking-wide text-[#8a97a6]">
                <tr>
                  <th className="px-4 py-2">RO #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th className="pr-4">Promised</th>
                </tr>
              </thead>
              <tbody>
                {activeJobs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-[#6b7c8d]" colSpan={5}>
                      No active repairs. New requests land here.
                    </td>
                  </tr>
                ) : (
                  activeJobs.map((job) => {
                    const chip = shopJobChip(job.status);
                    return (
                      <tr key={job.id} className="border-t border-[#eef3f8]">
                        <td className="px-4 py-3 font-bold text-[#2f7bff]">
                          <Link href={`/mechanic/jobs?job=${job.id}`}>{shopRoLabel(job.repairOrderNumber, job.id)}</Link>
                        </td>
                        <td className="font-semibold">
                          {job.customer.firstName} {job.customer.lastName.charAt(0)}.
                        </td>
                        <td className="text-[#5c6b7a]">
                          {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
                        </td>
                        <td>
                          <ShopPill label={chip.label} className={chip.className} />
                        </td>
                        <td className="pr-4 text-[#6b7c8d]">
                          {job.scheduledAt
                            ? job.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </ShopCard>
        <ShopCard>
          <ShopSectionTitle title="Recent Activity" href="/mechanic/jobs" />
          <div className="space-y-2 px-4 pb-4">
            {activity.length === 0 ? (
              <p className="py-6 text-sm text-[#6b7c8d]">Shop activity shows here as jobs move.</p>
            ) : (
              activity.map((item) => (
                <Link key={item.id} href={item.href} className="flex items-start justify-between gap-3 rounded-xl px-1 py-1.5 hover:bg-[#f8fafc]">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#102033]">{item.title}</p>
                    <p className="truncate text-[11px] text-[#6b7c8d]">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-[#8a97a6]">{formatRelative(item.at)}</span>
                </Link>
              ))
            )}
          </div>
        </ShopCard>
        <ShopCard className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-bold text-[#102033]">Shop Performance (MTD)</p>
            <Link href="/mechanic/reports" className="text-[12px] font-semibold text-[#2f7bff]">
              View All
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#eef3f8" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#2f7bff"
                  strokeWidth="4"
                  strokeDasharray={`${billedPct} ${100 - billedPct}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-extrabold text-[#102033]">{billedPct}%</p>
                <p className="text-[10px] text-[#8a97a6]">of {kpis.billedTarget} hrs</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-[12px]">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#2f7bff]" /> Billed Hours
                <span className="ml-auto font-bold">{kpis.billedHours.toFixed(1)}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#94a3b8]" /> Target Hours
                <span className="ml-auto font-bold">{kpis.billedTarget.toFixed(0)}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#16a34a]" /> Revenue
                <span className="ml-auto font-bold">{formatCents(kpis.revenueToday)}</span>
              </li>
            </ul>
          </div>
        </ShopCard>
      </div>
    </div>
  );
}

function AttentionRow({
  href,
  icon,
  label,
  count,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  detail: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#f8fafc]">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f7fb]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-[#102033]">
          {count} {label}
        </span>
        <span className="block text-[11px] text-[#8a97a6]">{detail}</span>
      </span>
      <span className="text-[#c5d0db]">›</span>
    </Link>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1.5 rounded-xl border border-[#e6eef6] bg-[#f8fafc] px-2 py-3 text-center text-[12px] font-semibold text-[#102033] hover:border-[#2f7bff]/30">
      <span className="text-[#2f7bff]">{icon}</span>
      {label}
    </Link>
  );
}
