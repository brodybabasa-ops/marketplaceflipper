import { Bell, LineChart, Radar, Save } from "lucide-react";

const FEATURES = [
  {
    icon: Radar,
    title: "24/7 Scanning",
    body: "We scan marketplace listings around the clock so you never miss a deal.",
  },
  {
    icon: LineChart,
    title: "Deal Score & Profit Estimator",
    body: "See estimated spread versus comparable listings and a transparent deal score.",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    body: "Get notified the moment new deals match your saved search.",
  },
  {
    icon: Save,
    title: "Export & Track",
    body: "Save favorites, keep searches, and click through to the original listing.",
  },
];

export function FeatureRow() {
  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((feature) => {
        const Icon = feature.icon;
        return (
          <div key={feature.title}>
            <Icon className="h-5 w-5 text-cyan-400" />
            <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{feature.body}</p>
          </div>
        );
      })}
    </section>
  );
}
