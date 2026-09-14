import Link from "next/link";
import { Download, MessageSquare, Plus, X } from "lucide-react";
import { AcceptJobButton } from "@/components/jobs/accept-job-button";
import { AppointmentCard } from "@/components/jobs/appointment-card";
import { InvoiceCard } from "@/components/jobs/invoice-card";
import { JobPhotos } from "@/components/jobs/job-photos";
import { jobStatusLabel } from "@/components/jobs/status-timeline";
import { ShopButton, ShopCard, ShopEmpty, ShopPageHeader, ShopPill, ShopTabs } from "@/components/shop-os/primitives";
import { createEstimateAction, saveRepairRecordAction, updateJobStatusAction } from "@/app/actions/marketplace";
import { issueShopInvoiceAction } from "@/app/actions/mechanic";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { vehiclePhotoFor } from "@/lib/landing";
import { formatCents } from "@/lib/money";
import { formatBoardDate } from "@/lib/utils";
import { shopJobChip, shopRoLabel, type ShopJobTab } from "@/lib/shop-os";
import { ALLOWED_JOB_TRANSITIONS } from "@/services/mechanics";
import type { EstimateLineCategory, EstimateStatus, JobStatus, PaymentStatus } from "@prisma/client";

export type ShopJobRow = {
  id: string;
  status: JobStatus;
  repairOrderNumber: string | null;
  scheduledAt: Date | null;
  totalCents: number;
  customer: { firstName: string; lastName: string };
  vehicle: { year: number; make: { name: string }; model: { name: string }; photoUrl?: string | null };
  serviceRequest: { problemText: string };
  resource?: { name: string } | null;
  estimates: { status: EstimateStatus; lineItems: { category: string }[] }[];
};

type PanelJob = {
  id: string;
  status: JobStatus;
  repairOrderNumber: string | null;
  scheduledAt: Date | null;
  totalCents: number;
  paymentStatus: PaymentStatus;
  customer: { firstName: string; lastName: string; email: string; phone: string | null };
  vehicle: { year: number; make: { name: string }; model: { name: string }; photoUrl: string | null; vin: string | null; mileage: number };
  serviceRequest: { problemText: string; description: string | null; preferredDate: Date | null; preferredTimeWindow: string | null };
  resource?: { name: string } | null;
  estimates: {
    id: string;
    type: "PRELIMINARY" | "PRIMARY" | "CHANGE_ORDER";
    status: EstimateStatus;
    reason: string | null;
    totalCents: number;
    createdAt: Date;
    lineItems: { id: string; category: EstimateLineCategory; description: string; quantity: number; unitCents: number; totalCents: number }[];
    approvals: { id: string; action: "APPROVED" | "DECLINED"; createdAt: Date }[];
  }[];
  photos: { id: string; url: string; kind: "BEFORE" | "AFTER" | "DIAGNOSIS" | "PARTS" | "OTHER"; caption: string | null }[];
  repairRecord: {
    title: string;
    diagnosis: string | null;
    partsReplaced: string | null;
    partNumbers: string | null;
    laborHours: number | null;
    mileage: number | null;
    warrantySummary: string | null;
  } | null;
  invoice: { number: string; status: "DRAFT" | "ISSUED" | "PAID" | "VOID"; totalCents: number; issuedAt: Date; paidAt: Date | null } | null;
  thread: { id: string } | null;
};

export function ShopJobsBoard({
  jobs,
  counts,
  tab,
  selectedId,
  selected,
  panel,
  q,
  sessionId,
}: {
  jobs: ShopJobRow[];
  counts: Record<ShopJobTab, number>;
  tab: ShopJobTab;
  selectedId?: string;
  selected?: PanelJob | null;
  panel?: string;
  q?: string;
  sessionId: string;
}) {
  const tabs: { id: ShopJobTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "progress", label: "In Progress" },
    { id: "parts", label: "Waiting on Parts" },
    { id: "approval", label: "Waiting on Approval" },
    { id: "completed", label: "Completed" },
    { id: "hold", label: "On Hold" },
    { id: "canceled", label: "Canceled" },
  ];
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader
        title="Jobs / Repairs"
        subtitle="Manage all repair orders, track progress, and keep your shop moving."
        actions={
          <>
            <ShopButton href="/mechanic/reports" variant="secondary">
              <Download className="h-4 w-4" /> Export
            </ShopButton>
            <ShopButton href="/mechanic/jobs/new">
              <Plus className="h-4 w-4" /> New Repair
            </ShopButton>
          </>
        }
      />
      <div className="mb-4">
        <ShopTabs
          items={tabs.map((item) => ({
            href: `/mechanic/jobs?tab=${item.id}${selectedId ? `&job=${selectedId}` : ""}`,
            label: item.label,
            count: counts[item.id],
            active: tab === item.id,
          }))}
        />
      </div>
      <div className={selected ? "grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]" : ""}>
        <ShopCard className="overflow-hidden">
          <form action="/mechanic/jobs" className="flex flex-wrap gap-2 border-b border-[#eef3f8] px-3 py-3">
            <input type="hidden" name="tab" value={tab} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search jobs..."
              className="h-9 min-w-[180px] flex-1 rounded-xl border border-[#e6eef6] bg-[#f8fafc] px-3 text-sm outline-none"
            />
          </form>
          {jobs.length === 0 ? (
            <ShopEmpty title={q ? "No jobs matched that search" : "Nothing here yet"} body="New customer requests will show up in this list." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-[13px]">
                <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#8a97a6]">
                  <tr>
                    <th className="px-4 py-2">RO #</th>
                    <th>Customer</th>
                    <th>Vehicle/Unit</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Promised Date</th>
                    <th className="pr-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const chip = shopJobChip(job.status, { lineItems: job.estimates.flatMap((item) => item.lineItems) });
                    const selectedRow = selectedId === job.id;
                    return (
                      <tr key={job.id} className={selectedRow ? "bg-[#eef4ff]" : "border-t border-[#eef3f8] hover:bg-[#f8fafc]"}>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Link href={`/mechanic/jobs?tab=${tab}&job=${job.id}`} className="font-bold text-[#2f7bff]">
                            {shopRoLabel(job.repairOrderNumber, job.id)}
                          </Link>
                        </td>
                        <td className="font-semibold">
                          {job.customer.firstName} {job.customer.lastName}
                        </td>
                        <td>
                          <span className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={job.vehicle.photoUrl || vehiclePhotoFor(job.vehicle.make.name, job.vehicle.model.name)}
                              alt=""
                              className="h-8 w-10 rounded object-cover"
                            />
                            <span>
                              {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
                            </span>
                          </span>
                        </td>
                        <td className="max-w-[180px] truncate text-[#5c6b7a]">{job.serviceRequest.problemText}</td>
                        <td>
                          <ShopPill label={chip.label} className={chip.className} />
                        </td>
                        <td>{job.resource?.name ?? "—"}</td>
                        <td className="text-[#6b7c8d]">
                          {job.scheduledAt
                            ? job.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" })
                            : "—"}
                        </td>
                        <td className="pr-4 font-semibold">{formatCents(job.totalCents)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ShopCard>
        {selected ? (
          <ShopJobPanel job={selected} panel={panel} sessionId={sessionId} returnTo={`/mechanic/jobs?tab=${tab}&job=${selected.id}`} />
        ) : null}
      </div>
    </div>
  );
}

export function ShopJobPanel({
  job,
  panel = "overview",
  sessionId,
  returnTo,
}: {
  job: PanelJob;
  panel?: string;
  sessionId: string;
  returnTo: string;
}) {
  const chip = shopJobChip(job.status, { lineItems: job.estimates.flatMap((item) => item.lineItems) });
  const nextStatuses = ALLOWED_JOB_TRANSITIONS[job.status];
  const latest = job.estimates[0];
  const photo = job.vehicle.photoUrl || vehiclePhotoFor(job.vehicle.make.name, job.vehicle.model.name);
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "estimate", label: "Estimate" },
    { id: "parts", label: `Parts${latest ? ` (${latest.lineItems.filter((item) => item.category === "PARTS").length})` : ""}` },
    { id: "notes", label: "Notes" },
    { id: "files", label: `Files (${job.photos.length})` },
  ];
  const current = tabs.some((item) => item.id === panel) ? panel : "overview";
  return (
    <ShopCard className="overflow-hidden">
      <div className="flex items-start justify-between gap-2 border-b border-[#eef3f8] px-4 py-3">
        <div>
          <p className="text-sm font-extrabold text-[#102033]">{shopRoLabel(job.repairOrderNumber, job.id)}</p>
          <ShopPill label={chip.label} className={`${chip.className} mt-1`} />
        </div>
        <Link href="/mechanic/jobs" className="text-[#8a97a6]">
          <X className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-[#eef3f8] px-3 py-2">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`${returnTo}&panel=${item.id}`}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${
              current === item.id ? "bg-[#e8f1ff] text-[#2f7bff]" : "text-[#6b7c8d]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-4">
        {current === "overview" ? (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" className="h-36 w-full rounded-xl object-cover" />
            <div>
              <p className="text-lg font-extrabold text-[#102033]">
                {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
              </p>
              <p className="text-sm font-semibold">
                {job.customer.firstName} {job.customer.lastName}
              </p>
              <p className="text-[12px] text-[#6b7c8d]">
                {job.customer.phone ?? "No phone"} · {job.customer.email}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[12px]">
              <div className="rounded-xl bg-[#f8fafc] p-2">
                <p className="text-[#8a97a6]">Promised Date</p>
                <p className="font-bold">{job.scheduledAt ? formatBoardDate(job.scheduledAt) : "TBD"}</p>
              </div>
              <div className="rounded-xl bg-[#f8fafc] p-2">
                <p className="text-[#8a97a6]">Total (Est.)</p>
                <p className="font-bold">{formatCents(latest?.totalCents ?? job.totalCents)}</p>
              </div>
              <div className="rounded-xl bg-[#f8fafc] p-2">
                <p className="text-[#8a97a6]">Assigned To</p>
                <p className="font-bold">{job.resource?.name ?? "Unassigned"}</p>
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#8a97a6]">Description</p>
              <p className="mt-1 text-sm">{job.serviceRequest.description || job.serviceRequest.problemText}</p>
            </div>
            {job.status === "REQUESTED" ? <AcceptJobButton jobId={job.id} label="Accept this request" size="md" /> : null}
            {nextStatuses.length ? (
              <form action={updateJobStatusAction} className="space-y-2">
                <input type="hidden" name="jobId" value={job.id} />
                <Select name="status" defaultValue={nextStatuses[0]}>
                  {nextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {jobStatusLabel(status, "shop")}
                    </option>
                  ))}
                </Select>
                <Button type="submit" size="sm">
                  Update status
                </Button>
              </form>
            ) : null}
            <JobTracker status={job.status} approved={job.estimates.some((item) => item.status === "APPROVED")} />
            <div className="grid grid-cols-2 gap-2">
              <ShopButton href={job.thread ? `/mechanic/messages/${job.thread.id}` : "/mechanic/messages"} variant="secondary" className="h-9 text-xs">
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </ShopButton>
              <form action={issueShopInvoiceAction}>
                <input type="hidden" name="jobId" value={job.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <ShopButton type="submit" variant="secondary" className="h-9 w-full text-xs">
                  Create Invoice
                </ShopButton>
              </form>
            </div>
            <AppointmentCard
              jobId={job.id}
              scheduledAt={job.scheduledAt}
              preferredDate={job.serviceRequest.preferredDate}
              preferredTimeWindow={job.serviceRequest.preferredTimeWindow}
              canEdit={job.status !== "COMPLETED" && job.status !== "CANCELLED"}
              surface="shop"
            />
            <InvoiceCard
              jobId={job.id}
              invoice={job.invoice}
              paymentStatus={job.paymentStatus}
              repairOrderNumber={job.repairOrderNumber}
              canPay={false}
              audience="shop"
            />
          </div>
        ) : null}
        {current === "estimate" ? (
          <div className="space-y-4">
            {job.estimates.map((estimate) => (
              <div key={estimate.id} className="rounded-xl border border-[#e6eef6] p-3">
                <div className="flex justify-between">
                  <p className="font-bold">{estimate.type === "CHANGE_ORDER" ? "Additional work" : "Estimate"}</p>
                  <p className="font-extrabold">{formatCents(estimate.totalCents)}</p>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {estimate.lineItems.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span>
                        {item.quantity} × {item.description}
                      </span>
                      <span>{formatCents(item.totalCents)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {job.status !== "COMPLETED" && job.status !== "CANCELLED" ? (
              <form action={createEstimateAction} className="space-y-2">
                <input type="hidden" name="jobId" value={job.id} />
                <Select name="type" defaultValue="PRIMARY">
                  <option value="PRELIMINARY">Preliminary estimate</option>
                  <option value="PRIMARY">Estimate</option>
                  <option value="CHANGE_ORDER">Additional work request</option>
                </Select>
                <Textarea name="reason" placeholder="During inspection we found..." />
                {[0, 1, 2].map((index) => (
                  <div key={index} className="grid gap-2">
                    <Select name="itemCategory" defaultValue={index === 0 ? "DIAGNOSTIC" : index === 1 ? "PARTS" : "LABOR"}>
                      <option>DIAGNOSTIC</option>
                      <option>PARTS</option>
                      <option>LABOR</option>
                      <option>SUPPLIES</option>
                      <option>OTHER</option>
                    </Select>
                    <Input name="itemDescription" placeholder="Description" defaultValue={index === 0 ? "Diagnostic labor" : ""} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="itemQuantity" defaultValue="1" />
                      <Input name="itemUnit" placeholder="0" defaultValue={index === 0 ? "95" : ""} />
                    </div>
                  </div>
                ))}
                <Button type="submit">Send to customer</Button>
              </form>
            ) : null}
          </div>
        ) : null}
        {current === "parts" ? (
          <div className="space-y-2 text-sm">
            {(latest?.lineItems.filter((item) => item.category === "PARTS") ?? []).length === 0 ? (
              <p className="text-[#6b7c8d]">No parts on the latest estimate.</p>
            ) : (
              latest?.lineItems
                .filter((item) => item.category === "PARTS")
                .map((item) => (
                  <div key={item.id} className="flex justify-between rounded-xl bg-[#f8fafc] px-3 py-2">
                    <span>
                      {item.quantity} × {item.description}
                    </span>
                    <span className="font-semibold">{formatCents(item.totalCents)}</span>
                  </div>
                ))
            )}
          </div>
        ) : null}
        {current === "notes" ? (
          <form action={saveRepairRecordAction} className="space-y-3">
            <input type="hidden" name="jobId" value={job.id} />
            <Field label="What was done">
              <Input name="title" required defaultValue={job.repairRecord?.title ?? job.serviceRequest.problemText} />
            </Field>
            <Field label="Diagnosis">
              <Textarea name="diagnosis" defaultValue={job.repairRecord?.diagnosis ?? ""} />
            </Field>
            <Field label="Parts replaced">
              <Input name="partsReplaced" defaultValue={job.repairRecord?.partsReplaced ?? ""} />
            </Field>
            <Button type="submit" size="sm">
              Save notes
            </Button>
          </form>
        ) : null}
        {current === "files" ? <JobPhotos jobId={job.id} photos={job.photos} canUpload surface="shop" /> : null}
      </div>
    </ShopCard>
  );
}

function JobTracker({ status, approved }: { status: JobStatus; approved: boolean }) {
  const steps = [
    { id: "checkin", label: "Check In", done: !["REQUESTED"].includes(status) },
    { id: "estimate", label: "Estimate", done: approved || status === "AWAITING_APPROVAL" || ["IN_PROGRESS", "COMPLETED"].includes(status) },
    { id: "approval", label: "Approval", done: approved },
    { id: "progress", label: "In Progress", done: ["IN_PROGRESS", "COMPLETED"].includes(status) || ["EN_ROUTE", "ARRIVED", "DIAGNOSING"].includes(status) },
    { id: "complete", label: "Complete", done: status === "COMPLETED" },
  ];
  return (
    <div>
      <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#8a97a6]">Status</p>
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${step.done ? "bg-[#16a34a] text-white" : "border border-[#dbe3ec] text-[#8a97a6]"}`}>
              {step.done ? "✓" : index + 1}
            </div>
            {index < steps.length - 1 ? <div className={`h-0.5 flex-1 ${step.done ? "bg-[#16a34a]" : "bg-[#e6eef6]"}`} /> : null}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[#8a97a6]">
        {steps.map((step) => (
          <span key={step.id}>{step.label}</span>
        ))}
      </div>
    </div>
  );
}
