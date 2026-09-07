import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "How it works" };

export default function HowItWorksPage() {
  const steps = [
    ["Tell us about the vehicle", "Year, make, model, and a sentence in your own words."],
    ["See who can actually help", "We match on specialty, location, availability, and performance — not who paid to be first."],
    ["Request service", "The mechanic sees the vehicle, the problem, and your preferred time."],
    ["Approve the estimate", "Work does not continue on extra items unless you say yes."],
    ["Track the job", "From accepted to arrived to completed, with a digital repair record at the end."],
    ["Review the completed job", "Reviews only come from finished Pocket Mechanic jobs."],
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-navy">How Pocket Mechanic works</h1>
      <p className="mt-3 text-muted">Built for people who know something is wrong, not for people who speak shop language.</p>
      <div className="mt-10 space-y-4">
        {steps.map(([title, body], index) => (
          <Card key={title} className="p-5">
            <p className="text-sm font-semibold text-accent">Step {index + 1}</p>
            <h2 className="mt-1 text-xl font-semibold text-navy">{title}</h2>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </Card>
        ))}
      </div>
      <Button asChild className="mt-8">
        <Link href="/mechanics">Find a Mechanic</Link>
      </Button>
    </div>
  );
}
