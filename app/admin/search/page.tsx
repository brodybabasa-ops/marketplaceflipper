import Link from "next/link";
import { requireSession } from "@/lib/guards";
import { hqSearch } from "@/services/hq";
import { staffRoles } from "@/lib/permissions";
import { Card } from "@/components/ui/card";

export const metadata = { title: "HQ search" };

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSession(staffRoles());
  const { q = "" } = await searchParams;
  const results = await hqSearch(q);
  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Search</h1>
      <p className="mt-1 text-sm text-muted">{q ? `Results for “${q}”` : "Use the HQ search bar."}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Customers</h2>
          {results.customers.map((item) => (
            <p key={item.id} className="mt-2 text-sm">
              <Link href={`/admin/customers/${item.id}`}>
                {item.firstName} {item.lastName} · {item.email}
              </Link>
            </p>
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Providers</h2>
          {results.providers.map((item) => (
            <Link key={item.id} href="/admin/mechanics" className="mt-2 block text-sm">
              {item.businessName}
            </Link>
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Jobs</h2>
          {results.jobs.map((item) => (
            <p key={item.id} className="mt-2 text-sm">
              {item.serviceRequest.problemText} · {item.mechanicProfile.businessName}
            </p>
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Vehicles</h2>
          {results.vehicles.map((item) => (
            <p key={item.id} className="mt-2 text-sm">
              {item.year} {item.make.name} {item.model.name} · {item.customer.email}
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
}
