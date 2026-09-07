import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = { title: "For mechanics" };

export default function ForMechanicsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold text-ink">Get work from customers who are ready to approve it in writing.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Pocket Mechanic is not a lead mill. Customers request service, you send an estimate, they approve, you do the job, and the review is tied to that job.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Requests that include the vehicle", "Year, make, model, problem, and photos — not a mystery phone call."],
          ["Estimates with an audit trail", "Additional work is a change order, not a quiet line-item edit."],
          ["A score you earn", "Pocket Score is performance, not advertising spend."],
        ].map(([title, body]) => (
          <Card key={title} className="p-5">
            <h2 className="font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </Card>
        ))}
      </div>
      <Button asChild className="mt-8">
        <Link href="/sign-up">Join as a mechanic</Link>
      </Button>
    </div>
  );
}
