import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Compare mechanics" };

export default async function ComparePage() {
  const ids = (await cookies()).get("pm_compare")?.value?.split(",").filter(Boolean) ?? [];
  const mechanics = ids.length
    ? await prisma.mechanicProfile.findMany({
        where: { id: { in: ids } },
        include: { user: true, specialties: true, makeExpertise: { include: { make: true } } },
      })
    : [];
  const rows = [
    ["Rating", (m: (typeof mechanics)[number]) => m.averageRating.toFixed(1)],
    ["Verified jobs", (m: (typeof mechanics)[number]) => String(m.completedJobsCount)],
    ["Verification", (m: (typeof mechanics)[number]) => (m.verificationLevel === "POCKET_VERIFIED" ? "Pocket Verified" : "Marketplace provider")],
    ["Select", (m: (typeof mechanics)[number]) => (m.isSelect ? "Yes" : "No")],
    ["Founding", (m: (typeof mechanics)[number]) => (m.isFoundingProvider ? `#${m.foundingNumber}` : "—")],
    ["Mode", (m: (typeof mechanics)[number]) => m.serviceMode.toLowerCase()],
    ["Response", (m: (typeof mechanics)[number]) => `${m.avgResponseMinutes} min`],
    ["Diagnostic", (m: (typeof mechanics)[number]) => formatCents(m.diagnosticPriceCents)],
    ["Specialties", (m: (typeof mechanics)[number]) => m.specialties.map((item) => item.category.toLowerCase()).slice(0, 4).join(", ")],
  ] as const;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-ink">Compare mechanics</h1>
      <p className="mt-2 text-sm text-muted">Up to three providers. Comparison does not change ranking.</p>
      {mechanics.length === 0 ? (
        <p className="mt-8 text-muted">
          Save providers from search with Compare, then return here. <Link href="/mechanics" className="text-accent">Find a mechanic</Link>
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="py-3 text-left text-muted"> </th>
                {mechanics.map((mechanic) => (
                  <th key={mechanic.id} className="px-3 py-3 text-left">
                    <Link href={`/mechanics/${mechanic.slug}`} className="font-semibold text-ink">
                      {mechanic.businessName}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-t border-line">
                  <td className="py-3 text-muted">{label}</td>
                  {mechanics.map((mechanic) => (
                    <td key={mechanic.id} className="px-3 py-3 text-ink">
                      {value(mechanic)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
