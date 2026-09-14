import Link from "next/link";
import { Phone, Plus, Video } from "lucide-react";
import { ThreadView } from "@/components/messages/thread-view";
import { ShopButton, ShopCard, ShopEmpty, ShopPageHeader, ShopPill } from "@/components/shop-os/primitives";
import { vehiclePhotoFor } from "@/lib/landing";
import { formatCents } from "@/lib/money";
import { shopJobChip, shopRoLabel } from "@/lib/shop-os";
import { formatRelative, initials } from "@/lib/utils";
import { latestIsUnread } from "@/services/messages";
import type { EstimateStatus, JobStatus } from "@prisma/client";

export type ShopThreadListItem = {
  id: string;
  lastMessageAt: Date;
  customer: { firstName: string; lastName: string; avatarUrl?: string | null };
  messages: { senderId: string; readAt: Date | null; body: string }[];
  job: {
    repairOrderNumber: string | null;
    serviceRequest: { problemText: string };
    vehicle: { year: number; make: { name: string }; model: { name: string } };
  } | null;
};

type SelectedThread = {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  job: {
    id: string;
    status: JobStatus;
    repairOrderNumber: string | null;
    scheduledAt: Date | null;
    serviceRequest: { problemText: string };
    vehicle: { year: number; make: { name: string }; model: { name: string }; vin: string | null; photoUrl: string | null };
    estimates: { id: string; status: EstimateStatus; totalCents: number; createdAt: Date }[];
  } | null;
  messages: { id: string; senderId: string; senderName: string; body: string; createdAt: Date }[];
};

export function ShopMessagesBoard({
  threads,
  selected,
  selfId,
  tab,
  q,
  unreadCount,
}: {
  threads: ShopThreadListItem[];
  selected: SelectedThread | null;
  selfId: string;
  tab: "all" | "unread" | "customers" | "estimates" | "jobs" | "archived";
  q?: string;
  unreadCount: number;
}) {
  const tabs = [
    { id: "all", label: "All Messages", count: unreadCount || undefined },
    { id: "unread", label: "Unread" },
    { id: "customers", label: "Customers" },
    { id: "estimates", label: "Estimates" },
    { id: "jobs", label: "Jobs" },
  ] as const;
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[#e6eef6] bg-white px-5 py-4 lg:px-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#102033]">Messages</h1>
          <p className="text-sm text-[#6b7c8d]">Stay connected with your customers. Send updates, photos, estimates, and more.</p>
        </div>
        <ShopButton href="/mechanic/customers">
          <Plus className="h-4 w-4" /> New Message
        </ShopButton>
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-[#e6eef6] bg-white px-5 py-2 lg:px-6">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/mechanic/messages?tab=${item.id}`}
            className={`inline-flex h-8 items-center rounded-full px-3 text-[13px] font-semibold ${
              tab === item.id ? "bg-[#2f7bff] text-white" : "text-[#5c6b7a]"
            }`}
          >
            {item.label}
            {item.id === "all" && unreadCount ? (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]">{unreadCount}</span>
            ) : null}
          </Link>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        <aside className="border-r border-[#e6eef6] bg-white">
          <form action="/mechanic/messages" className="p-3">
            <input type="hidden" name="tab" value={tab} />
            <input name="q" defaultValue={q} placeholder="Search conversations..." className="h-9 w-full rounded-xl border border-[#e6eef6] bg-[#f8fafc] px-3 text-sm outline-none" />
          </form>
          <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            {threads.length === 0 ? (
              <p className="px-4 py-8 text-sm text-[#6b7c8d]">No conversations yet.</p>
            ) : (
              threads.map((thread) => {
                const unread = latestIsUnread(thread.messages[0], selfId);
                const active = selected?.id === thread.id;
                return (
                  <Link
                    key={thread.id}
                    href={`/mechanic/messages/${thread.id}`}
                    className={`flex gap-3 border-b border-[#f1f5f9] px-3 py-3 ${active ? "bg-[#eef4ff]" : "hover:bg-[#f8fafc]"}`}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2f7bff] text-xs font-bold text-white">
                      {initials(thread.customer.firstName, thread.customer.lastName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[13px] font-bold">
                          {thread.customer.firstName} {thread.customer.lastName}
                        </p>
                        <span className="text-[11px] text-[#8a97a6]">{formatRelative(thread.lastMessageAt)}</span>
                      </div>
                      <p className="truncate text-[12px] text-[#5c6b7a]">{thread.messages[0]?.body ?? "No messages yet"}</p>
                      <p className="truncate text-[11px] text-[#8a97a6]">
                        {thread.job
                          ? `${shopRoLabel(thread.job.repairOrderNumber, thread.id)} · ${thread.job.vehicle.year} ${thread.job.vehicle.make.name}`
                          : "Shop conversation"}
                      </p>
                    </div>
                    {unread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2f7bff]" /> : null}
                  </Link>
                );
              })
            )}
          </div>
        </aside>
        <section className="min-w-0 bg-[#f8fafc]">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[#e6eef6] bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2f7bff] text-xs font-bold text-white">
                    {initials(selected.customer.firstName, selected.customer.lastName)}
                  </span>
                  <div>
                    <p className="font-bold">
                      {selected.customer.firstName} {selected.customer.lastName}
                    </p>
                    <p className="text-[12px] text-[#6b7c8d]">{selected.customer.phone ?? selected.customer.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 text-[#2f7bff]">
                  <Phone className="h-4 w-4" />
                  <Video className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ThreadView
                  threadId={selected.id}
                  selfId={selfId}
                  title=""
                  messages={selected.messages}
                  returnTo={`/mechanic/messages/${selected.id}`}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <ShopEmpty title="Select a conversation" body="Customer messages land here. Your reply shows on their board." />
            </div>
          )}
        </section>
        <aside className="hidden border-l border-[#e6eef6] bg-white xl:block">
          {selected ? <CustomerContext thread={selected} /> : null}
        </aside>
      </div>
    </div>
  );
}

function CustomerContext({ thread }: { thread: SelectedThread }) {
  const job = thread.job;
  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="font-extrabold">
          {thread.customer.firstName} {thread.customer.lastName}
        </p>
        <p className="text-[12px] text-[#6b7c8d]">Customer</p>
        <p className="mt-2 text-[13px]">{thread.customer.phone ?? "No phone"}</p>
        <p className="text-[13px] text-[#6b7c8d]">{thread.customer.email}</p>
      </div>
      {job ? (
        <>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#8a97a6]">Vehicles (1)</p>
              <Link href="/mechanic/vehicles" className="text-[12px] font-semibold text-[#2f7bff]">
                View All
              </Link>
            </div>
            <Link href={`/mechanic/jobs?job=${job.id}`} className="flex gap-2 rounded-xl bg-[#f8fafc] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={job.vehicle.photoUrl || vehiclePhotoFor(job.vehicle.make.name, job.vehicle.model.name)} alt="" className="h-12 w-16 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold">
                  {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
                </p>
                <p className="truncate text-[11px] text-[#8a97a6]">{job.vehicle.vin ?? "No VIN on file"}</p>
              </div>
            </Link>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#8a97a6]">Active Job</p>
              <Link href={`/mechanic/jobs?job=${job.id}`} className="text-[12px] font-semibold text-[#2f7bff]">
                View Job
              </Link>
            </div>
            <div className="rounded-xl border border-[#e6eef6] p-3">
              <div className="flex items-center justify-between">
                <p className="font-bold">{shopRoLabel(job.repairOrderNumber, job.id)}</p>
                <ShopPill label={shopJobChip(job.status).label} className={shopJobChip(job.status).className} />
              </div>
              <p className="mt-1 text-[13px]">{job.serviceRequest.problemText}</p>
              <p className="mt-1 text-[11px] text-[#8a97a6]">
                Promised:{" "}
                {job.scheduledAt
                  ? job.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" })
                  : "TBD"}
              </p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#8a97a6]">Estimates</p>
            <div className="space-y-2">
              {job.estimates.length === 0 ? (
                <p className="text-sm text-[#6b7c8d]">No estimates yet.</p>
              ) : (
                job.estimates.map((estimate) => (
                  <Link key={estimate.id} href={`/mechanic/estimates?id=${estimate.id}`} className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2">
                    <span>
                      <span className="block text-[12px] font-bold">{shopRoLabel(null, estimate.id).replace("#", "EST-")}</span>
                      <span className="text-[11px] text-[#8a97a6]">{estimate.status.toLowerCase()}</span>
                    </span>
                    <span className="font-bold">{formatCents(estimate.totalCents)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-[#6b7c8d]">Shop conversation — not tied to a repair order.</p>
      )}
      <div>
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#8a97a6]">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <ShopButton href={job ? `/mechanic/jobs?job=${job.id}&panel=estimate` : "/mechanic/jobs"} variant="secondary" className="h-9 text-[11px]">
            Send Estimate
          </ShopButton>
          <ShopButton href="/mechanic/jobs/new" variant="secondary" className="h-9 text-[11px]">
            Create Job
          </ShopButton>
          <ShopButton href="/mechanic/schedule" variant="secondary" className="h-9 text-[11px]">
            Schedule
          </ShopButton>
          <ShopButton href={job ? `/mechanic/jobs?job=${job.id}&panel=notes` : "/mechanic/jobs"} variant="secondary" className="h-9 text-[11px]">
            Add Note
          </ShopButton>
        </div>
      </div>
    </div>
  );
}
