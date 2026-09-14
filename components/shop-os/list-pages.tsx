import Link from "next/link";
import { ShopCard, ShopEmpty, ShopPageHeader, ShopPill } from "@/components/shop-os/primitives";
import { OfferResponseButtons } from "@/components/jobs/offer-response-buttons";
import { formatCents } from "@/lib/money";
import { shopJobChip } from "@/lib/shop-os";
import { formatBoardDate } from "@/lib/utils";
import { TeamSettings, type TeamLane } from "@/components/scheduler/team-settings";
import type { JobStatus } from "@prisma/client";

export function ShopCustomersView({
  customers,
  q,
}: {
  q?: string;
  customers: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    jobCount: number;
    lastJob: string;
    href: string;
  }[];
}) {
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader title="Customers" subtitle="People attached to jobs at this shop." />
      <ShopCard className="overflow-hidden">
        <form action="/mechanic/customers" className="border-b border-[#eef3f8] px-3 py-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search customers..."
            className="h-9 w-full rounded-xl border border-[#e6eef6] bg-[#f8fafc] px-3 text-sm outline-none"
          />
        </form>
        {customers.length === 0 ? (
          <ShopEmpty title="No customers yet" body="Jobs at this shop will list the customer here." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#8a97a6]">
              <tr>
                <th className="px-4 py-2">Customer</th>
                <th>Contact</th>
                <th>Jobs</th>
                <th className="pr-4">Latest</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-[#eef3f8]">
                  <td className="px-4 py-3">
                    <Link href={customer.href} className="font-bold text-[#102033]">
                      {customer.firstName} {customer.lastName}
                    </Link>
                  </td>
                  <td className="text-[#6b7c8d]">{customer.phone ?? customer.email}</td>
                  <td>{customer.jobCount}</td>
                  <td className="pr-4">{customer.lastJob}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ShopCard>
    </div>
  );
}

export function ShopVehiclesView({
  vehicles,
}: {
  vehicles: {
    id: string;
    label: string;
    customer: string;
    vin: string | null;
    href: string;
    photo: string;
  }[];
}) {
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader title="Vehicles" subtitle="Machines this shop has on a job." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {vehicles.length === 0 ? (
          <ShopCard>
            <ShopEmpty title="No vehicles yet" body="Incoming jobs attach customer machines here." />
          </ShopCard>
        ) : (
          vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={vehicle.href}>
              <ShopCard className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={vehicle.photo} alt="" className="h-36 w-full object-cover" />
                <div className="p-4">
                  <p className="font-bold">{vehicle.label}</p>
                  <p className="text-sm text-[#6b7c8d]">{vehicle.customer}</p>
                  <p className="mt-1 text-[12px] text-[#8a97a6]">{vehicle.vin ?? "No VIN"}</p>
                </div>
              </ShopCard>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function ShopInventoryView() {
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader title="Inventory" subtitle="Parts on order stay on the live job until a parts catalog is connected." />
      <ShopCard>
        <ShopEmpty
          title="No parts catalog yet"
          body="Waiting-on-parts jobs already show on Jobs and the scheduler. A stock room will plug into those same repair orders."
        />
      </ShopCard>
    </div>
  );
}

export function ShopInvoicingView({
  invoices,
}: {
  invoices: {
    id: string;
    number: string;
    status: string;
    totalCents: number;
    customer: string;
    href: string;
    issuedAt: Date;
  }[];
}) {
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader title="Invoicing & Payments" subtitle="Invoices issue from completed jobs with an approved estimate." />
      <ShopCard className="overflow-hidden">
        {invoices.length === 0 ? (
          <ShopEmpty title="No invoices yet" body="Mark a job complete after an approved estimate and the invoice lands here." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#8a97a6]">
              <tr>
                <th className="px-4 py-2">Invoice</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Issued</th>
                <th className="pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-[#eef3f8]">
                  <td className="px-4 py-3">
                    <Link href={invoice.href} className="font-bold text-[#2f7bff]">
                      {invoice.number}
                    </Link>
                  </td>
                  <td>{invoice.customer}</td>
                  <td>
                    <ShopPill
                      label={invoice.status.toLowerCase()}
                      className={invoice.status === "PAID" ? "bg-[#e7f8ee] text-[#15803d]" : "bg-[#fff6d6] text-[#b45309]"}
                    />
                  </td>
                  <td>{formatBoardDate(invoice.issuedAt)}</td>
                  <td className="pr-4 font-semibold">{formatCents(invoice.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ShopCard>
    </div>
  );
}

export function ShopReportsView({
  jobs,
  estimates,
  reviews,
  revenue,
}: {
  jobs: number;
  estimates: number;
  reviews: number;
  revenue: number;
}) {
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader title="Reports" subtitle="Live totals from this shop. Advanced reporting is on the Pro plan." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ShopCard className="p-4">
          <p className="text-sm text-[#6b7c8d]">Jobs</p>
          <p className="text-2xl font-extrabold">{jobs}</p>
        </ShopCard>
        <ShopCard className="p-4">
          <p className="text-sm text-[#6b7c8d]">Estimates</p>
          <p className="text-2xl font-extrabold">{estimates}</p>
        </ShopCard>
        <ShopCard className="p-4">
          <p className="text-sm text-[#6b7c8d]">Reviews</p>
          <p className="text-2xl font-extrabold">{reviews}</p>
        </ShopCard>
        <ShopCard className="p-4">
          <p className="text-sm text-[#6b7c8d]">Paid volume</p>
          <p className="text-2xl font-extrabold">{formatCents(revenue)}</p>
        </ShopCard>
      </div>
    </div>
  );
}

export function ShopTeamView({ resources }: { resources: TeamLane[] }) {
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader title="Team" subtitle="Technicians, bays, and mobile units on the scheduler." />
      <div className="rounded-2xl bg-[#071422] p-4 text-white">
        <TeamSettings resources={resources} returnTo="/mechanic/team" />
      </div>
    </div>
  );
}

export function ShopRequestsView({
  offers,
  jobs,
}: {
  offers: {
    id: string;
    problemText: string;
    customer: string;
    vehicle: string;
  }[];
  jobs: {
    id: string;
    status: JobStatus;
    customer: string;
    vehicle: string;
    problemText: string;
  }[];
}) {
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader title="Incoming requests" subtitle="Customers who asked this shop for help." />
      {offers.length ? (
        <div className="mb-6 space-y-3">
          {offers.map((offer) => (
            <ShopCard key={offer.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{offer.customer}</p>
                  <p className="text-sm text-[#6b7c8d]">{offer.vehicle}</p>
                  <p className="mt-1 text-sm">{offer.problemText}</p>
                </div>
                <OfferResponseButtons offerId={offer.id} />
              </div>
            </ShopCard>
          ))}
        </div>
      ) : null}
      <ShopCard className="overflow-hidden">
        {jobs.length === 0 && offers.length === 0 ? (
          <ShopEmpty title="No new requests" body="Incoming matches and open repair orders land here." />
        ) : (
          <ul>
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-3 border-b border-[#eef3f8] px-4 py-3 last:border-0">
                <Link href={`/mechanic/jobs?job=${job.id}`} className="min-w-0">
                  <p className="font-bold">{job.customer}</p>
                  <p className="truncate text-sm text-[#6b7c8d]">
                    {job.vehicle} · {job.problemText}
                  </p>
                </Link>
                <ShopPill label={shopJobChip(job.status).label} className={shopJobChip(job.status).className} />
              </li>
            ))}
          </ul>
        )}
      </ShopCard>
    </div>
  );
}
