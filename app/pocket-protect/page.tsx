import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Pocket Protect" };

export default function PocketProtectPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-ink">Pocket Protect</h1>
      <p className="mt-3 text-lg text-muted">An extra layer of confidence when you book through Pocket Mechanic.</p>
      <div className="mt-8 space-y-3">
        {[
          "Documented estimate",
          "Customer approval records",
          "Digital repair record",
          "Mechanic verification",
          "Communication history",
          "Dispute workflow",
        ].map((item) => (
          <Card key={item} className="p-4 font-medium text-ink">
            {item}
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        Pocket Protect is not insurance and does not currently guarantee financial coverage. A future protection program would require legal review before any coverage claims are made.
      </p>
      <Button asChild className="mt-6">
        <Link href="/legal/protection-terms">Read the placeholder terms</Link>
      </Button>
    </div>
  );
}
