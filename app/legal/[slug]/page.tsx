import { LEGAL_PAGES } from "@/lib/constants";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = LEGAL_PAGES.find((item) => item.href === `/legal/${slug}`);
  if (!page) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-warning">Placeholder pending legal review</p>
      <h1 className="mt-2 text-4xl font-bold text-navy">{page.title}</h1>
      <Card className="mt-6 space-y-3 p-6 text-sm leading-6 text-muted">
        <p>
          This page is an architectural placeholder. It is not final legal language and must not be treated as sufficient
          for launch.
        </p>
        <p>
          Pocket Mechanic is a marketplace that connects customers with independent automotive service providers. Mechanics
          are independent service providers and are responsible for the services they perform. Pocket Mechanic does not
          diagnose vehicles.
        </p>
        <p>{page.status}.</p>
      </Card>
    </div>
  );
}
