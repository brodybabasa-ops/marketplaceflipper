import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = { title: "Pocket Protect" };

export default function PocketProtectPage() {
  return (
    <MarketingShell
      title="Pocket"
      accent="Protect"
      subtitle="An extra layer of confidence when you book through Pocket Mechanic."
      image="/landing/lifestyle.png"
      objectPosition="object-[center_40%]"
      script={"More Time\nOut Here."}
    >
      <div className="space-y-3">
        {[
          "Documented estimate",
          "Customer approval records",
          "Digital repair record",
          "Shop verification",
          "Communication history",
          "Dispute workflow",
        ].map((item) => (
          <article key={item} className="rounded-2xl bg-white p-4 font-medium shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
            {item}
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        Pocket Protect is not insurance and does not currently guarantee financial coverage. A future protection program
        would require legal review before any coverage claims are made.
      </p>
      <Link href="/legal/protection-terms" className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#2f7bff] px-5 text-sm font-semibold text-white">
        Read the placeholder terms
      </Link>
    </MarketingShell>
  );
}
