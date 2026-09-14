import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = { title: "How it works" };

export default function HowItWorksPage() {
  const steps = [
    ["Tell us about the machine", "Year, make, model, and a sentence in your own words — truck, boat, bike, or RV."],
    ["See who can actually help", "We match on specialty, location, availability, and performance — not who paid to be first."],
    ["Request service", "The shop sees the vehicle, the problem, and your preferred time."],
    ["Approve the estimate", "Work does not continue on extra items unless you say yes."],
    ["Track the job", "From accepted to in service to complete, with a digital repair record at the end."],
    ["Review the completed job", "Reviews only come from finished Pocket Mechanic jobs."],
  ];
  return (
    <MarketingShell
      title="How Pocket Mechanic"
      accent="works."
      subtitle="Built for people who know something is wrong, not for people who speak shop language."
      script={"Get it Fixed.\nGet back out there."}
    >
      <div className="space-y-4">
        {steps.map(([title, body], index) => (
          <article key={title} className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
            <p className="text-sm font-semibold text-[#2f7bff]">Step {index + 1}</p>
            <h2 className="mt-1 text-xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </article>
        ))}
      </div>
      <Link href="/mechanics" className="mt-8 inline-flex h-11 items-center rounded-xl bg-[#2f7bff] px-5 text-sm font-semibold text-white">
        Find a Shop
      </Link>
    </MarketingShell>
  );
}
