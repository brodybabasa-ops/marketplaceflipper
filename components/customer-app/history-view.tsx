import { Calendar, ChevronRight, Ellipsis, FileText, Wrench } from "lucide-react";
import {
  AppCard,
  AppPageHeader,
  FilterTabs,
  OutlineButton,
  SearchSortBar,
  StatusBadge,
  VerifiedMark,
} from "@/components/customer-app/primitives";
import type { HistoryRow } from "@/services/customer-history";
import { historyKindLabel, type VehicleKind } from "@/lib/vehicles";

export function CustomerHistoryView({
  rows,
  counts,
  kind,
  q,
  sort,
}: {
  rows: HistoryRow[];
  counts: Record<"all" | VehicleKind, number>;
  kind: string;
  q: string;
  sort: string;
}) {
  const active = kind || "all";
  let visible = active === "all" ? rows : rows.filter((row) => row.kind === active);
  if (q) {
    const needle = q.toLowerCase();
    visible = visible.filter(
      (row) =>
        row.vehicleLabel.toLowerCase().includes(needle) ||
        row.problem.toLowerCase().includes(needle) ||
        row.shopName.toLowerCase().includes(needle),
    );
  }
  if (sort === "oldest") visible = [...visible].reverse();
  if (sort === "cost") visible = [...visible].sort((a, b) => b.cost.localeCompare(a.cost, undefined, { numeric: true }));

  const groups = new Map<string, HistoryRow[]>();
  for (const row of visible) {
    const list = groups.get(row.month) ?? [];
    list.push(row);
    groups.set(row.month, list);
  }

  return (
    <div className="px-4 pt-2">
      <AppPageHeader title="Repair History" subtitle="A complete record of all your past repairs and services." />
      <FilterTabs
        param="kind"
        extra={{ q, sort: sort !== "newest" ? sort : undefined }}
        value={active}
        tabs={[
          { id: "all", label: "All", count: counts.all },
          { id: "auto", label: historyKindLabel("auto"), count: counts.auto },
          { id: "marine", label: historyKindLabel("marine"), count: counts.marine },
          { id: "powersports", label: historyKindLabel("powersports"), count: counts.powersports },
          { id: "rv", label: historyKindLabel("rv"), count: counts.rv },
        ]}
      />
      <SearchSortBar
        action="/history"
        searchPlaceholder="Search past repairs..."
        searchDefault={q}
        sortDefault={sort}
        sortOptions={[
          { value: "newest", label: "Newest First" },
          { value: "oldest", label: "Oldest First" },
          { value: "cost", label: "Highest cost" },
        ]}
        hidden={{ ...(active !== "all" ? { kind: active } : {}) }}
      />
      {visible.length === 0 ? (
        <div className="mt-8 rounded-[22px] border border-white/10 bg-[#0c1d30] p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-white/35" />
          <p className="mt-3 text-sm font-bold text-white">No repair history yet</p>
          <p className="mt-1 text-xs text-white/50">Once you complete a repair, it will show up here.</p>
          <a
            href="/mechanics"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#2f7bff] px-5 text-sm font-bold text-white"
          >
            Find a Shop
          </a>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {[...groups.entries()].map(([month, items]) => (
            <section key={month}>
              <h2 className="mb-3 text-sm font-bold text-white/50">{month}</h2>
              <div className="space-y-3">
                {items.map((row) => (
                  <AppCard key={row.id} className="p-3">
                    <div className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={row.photo} alt="" className="h-[72px] w-[88px] shrink-0 rounded-2xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <a href={row.href} className="min-w-0">
                            <p className="text-[15px] font-extrabold text-white">{row.vehicleLabel}</p>
                            <p className="text-xs text-white/55">{row.problem}</p>
                          </a>
                          <div className="flex shrink-0 items-center gap-1">
                            <StatusBadge label="Completed" tone="success" />
                            <a href={row.href} className="text-white/35" aria-label="Repair details">
                              <ChevronRight className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={row.shopPhoto} alt="" className="h-5 w-5 rounded-full object-cover" />
                          <span className="font-semibold text-white/70">{row.shopName}</span>
                          <VerifiedMark className="h-3 w-3" />
                          <span>· {row.dateLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-[#2f7bff]" />
                        <div>
                          <p className="text-white/40">Total Cost</p>
                          <p className="font-bold text-white">{row.cost}</p>
                        </div>
                      </div>
                      <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs">
                        <Wrench className="h-3.5 w-3.5 text-[#2f7bff]" />
                        <div>
                          <p className="text-white/40">Labor</p>
                          <p className="font-bold text-white">{row.labor}</p>
                        </div>
                      </div>
                      <OutlineButton href={row.invoiceHref} className="h-11 max-w-[120px] flex-none">
                        View Invoice
                      </OutlineButton>
                      <a href={row.href} className="inline-flex h-11 w-10 items-center justify-center rounded-xl border border-white/10 text-white/45" aria-label="More">
                        <Ellipsis className="h-4 w-4" />
                      </a>
                    </div>
                  </AppCard>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
