import Link from "next/link";
import { PenSquare, Search } from "lucide-react";
import { AppCard, AppPageHeader, FilterTabs, VerifiedMark } from "@/components/customer-app/primitives";
import { shopPhotoFor } from "@/lib/landing";
import { formatThreadTime } from "@/lib/customer-app";
import { cn } from "@/lib/utils";

export type MessageThreadRow = {
  id: string;
  href: string;
  shopName: string;
  shopSlug: string | null;
  verified: boolean;
  preview: string;
  when: Date;
  unread: number;
  kind: "shops" | "estimates" | "support";
};

export function CustomerMessagesView({
  threads,
  tab,
  q,
}: {
  threads: MessageThreadRow[];
  tab: string;
  q: string;
}) {
  const active = tab || "all";
  const unreadCount = threads.filter((thread) => thread.unread > 0).length;
  let visible = threads;
  if (active === "unread") visible = threads.filter((thread) => thread.unread > 0);
  if (active === "shops") visible = threads.filter((thread) => thread.kind === "shops");
  if (active === "estimates") visible = threads.filter((thread) => thread.kind === "estimates");
  if (active === "support") visible = threads.filter((thread) => thread.kind === "support");
  if (q) {
    const needle = q.toLowerCase();
    visible = visible.filter((thread) => thread.shopName.toLowerCase().includes(needle) || thread.preview.toLowerCase().includes(needle));
  }

  return (
    <div className="px-4 pt-2">
      <AppPageHeader
        title="Messages"
        subtitle="Chat with shops, get updates, and keep everything in one place."
        action={
          <Link href="/mechanics" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2f7bff] text-white" aria-label="New message">
            <PenSquare className="h-4 w-4" />
          </Link>
        }
      />
      <form action="/messages" className="relative">
        {active !== "all" ? <input type="hidden" name="tab" value={active} /> : null}
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search conversations..."
          className="h-11 w-full rounded-full border border-white/10 bg-[#0c1d30] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35"
        />
      </form>
      <div className="mt-3">
        <FilterTabs
          value={active}
          extra={{ q: q || undefined }}
          tabs={[
            { id: "all", label: "All", count: threads.length },
            { id: "unread", label: "Unread", count: unreadCount },
            { id: "shops", label: "Shops", count: threads.filter((thread) => thread.kind === "shops").length },
            { id: "estimates", label: "Estimates", count: threads.filter((thread) => thread.kind === "estimates").length },
            { id: "support", label: "Support", count: threads.filter((thread) => thread.kind === "support").length },
          ]}
        />
      </div>
      <div className="mt-4 space-y-2">
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#0c1d30] p-5 text-sm text-white/55">No conversations yet. Start from a shop or a repair.</p>
        ) : (
          visible.map((thread) => (
            <AppCard key={thread.id} href={thread.href} className="p-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shopPhotoFor(thread.shopSlug ?? "precision-auto-care")}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1 truncate text-sm font-extrabold text-white">
                      {thread.shopName}
                      {thread.verified ? <VerifiedMark /> : null}
                    </p>
                    <span className="shrink-0 text-[11px] text-white/40">{formatThreadTime(thread.when)}</span>
                  </div>
                  <p className={cn("mt-0.5 truncate text-xs", thread.unread ? "font-semibold text-white/80" : "text-white/45")}>
                    {thread.preview}
                  </p>
                </div>
                {thread.unread > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2f7bff] px-1 text-[10px] font-bold">
                    {thread.unread}
                  </span>
                ) : (
                  <span className="text-white/25">›</span>
                )}
              </div>
            </AppCard>
          ))
        )}
      </div>
    </div>
  );
}
