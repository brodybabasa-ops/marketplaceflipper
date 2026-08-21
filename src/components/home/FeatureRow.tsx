import { Bell, LineChart, Radar, Save } from "lucide-react";

const FEATURES = [
  {
    icon: Radar,
    title: "Deals on one board",
    body: "Asking price, location, and freshness in one place so you are not hunting through Marketplace tabs.",
  },
  {
    icon: LineChart,
    title: "Deal score & estimated profit",
    body: "See spread versus comparable listings, margin, and a transparent deal score before you click through.",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    body: "Get notified the moment a new listing matches a saved search.",
  },
  {
    icon: Save,
    title: "Open on Facebook",
    body: "Save favorites, then message the seller on Facebook Marketplace. FlipFinder never hosts the sale.",
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
