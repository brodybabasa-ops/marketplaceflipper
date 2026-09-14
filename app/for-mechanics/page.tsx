import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = { title: "For shops" };

export default function ForMechanicsPage() {
  return (
    <MarketingShell
      title="Get work from customers who are ready to"
      accent="approve it in writing."
      subtitle="Pocket Mechanic is not a lead mill. Customers request service, you send an estimate, they approve, you do the job, and the review is tied to that job."
      image="/landing/shop-1.png"
      objectPosition="object-center"
      script={"Same Roads.\nDifferent Machines.\nSame Solution."}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Requests that include the machine", "Year, make, model, problem, and photos — not a mystery phone call."],
          ["Estimates with an audit trail", "Additional work is a change order, not a quiet line-item edit."],
          ["A score you earn", "Pocket Score is performance, not advertising spend."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </article>
        ))}
      </div>
      <Link href="/sign-up" className="mt-8 inline-flex h-11 items-center rounded-xl bg-[#2f7bff] px-5 text-sm font-semibold text-white">
        Join as a shop
      </Link>
    </MarketingShell>
  );
}
