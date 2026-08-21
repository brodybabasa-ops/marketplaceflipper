import { Radar, LineChart, ExternalLink } from "lucide-react";

const STEPS = [
  {
    icon: Radar,
    title: "We put the deal in front of you",
    body: "Search Marketplace categories and see asking price, location, and freshness in one board.",
  },
  {
    icon: LineChart,
    title: "We score profit before you click",
    body: "Deal score, estimated market, and spread come from comparable listings in this catalog — not a guess.",
  },
  {
    icon: ExternalLink,
    title: "You open it on Facebook",
    body: "Message the seller and complete the purchase on Facebook Marketplace. FlipFinder never hosts checkout.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">How it works</p>
      <h2 className="mt-2 text-2xl font-semibold">Find it here. Buy it on Facebook.</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="rounded-2xl border border-white/8 bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Step {index + 1}
              </p>
              <Icon className="mt-3 h-5 w-5 text-cyan-400" />
              <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{step.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
