import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { DealBadge } from "@/components/listings/DealBadge";
import {
  dealSnapshot,
  isLiveSourceUrl,
  marketplaceHomeUrl,
} from "@/lib/marketplace";
import { formatLocation, listingTitle, sourceLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function GoToMarketplacePage({ params }: Props) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) notFound();

  if (isLiveSourceUrl(listing.sourceUrl)) {
    redirect(listing.sourceUrl);
  }

  const session = await getSession();
  const title = listingTitle(listing);
  const snapshot = dealSnapshot(listing);
  const destination = marketplaceHomeUrl(listing.source);
  const destinationLabel =
    listing.source === "ksl" ? "KSL Classifieds" : "Facebook Marketplace";

  return (
    <AppShell user={session}>
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Continue on {sourceLabel(listing.source === "mock" ? "facebook" : listing.source)}
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {formatLocation(listing.city, listing.state)} · FlipFinder scored this deal. The seller is on
          the original marketplace.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Stat label="Asking" value={snapshot.ask} />
          <Stat label="Est. market" value={snapshot.market} />
          <Stat label="Est. profit" value={snapshot.profit} accent />
          <Stat label="Margin" value={snapshot.margin} />
        </div>
        <div className="mt-4">
          <DealBadge score={listing.dealScore} />
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-400">
          This catalog is sample Marketplace inventory, so there is no live Facebook post for this exact
          item. In production, this button opens the original listing URL. Continue to Facebook Marketplace
          to browse and message sellers there.
        </p>

        <a
          href={destination}
          target="_blank"
          rel="noreferrer"
          className="btn-gradient mt-6 flex h-12 items-center justify-center rounded-xl text-sm font-semibold"
        >
          Continue to {destinationLabel}
        </a>
        <Link href={`/listing/${listing.id}`} className="mt-3 block text-center text-sm text-slate-400">
          Back to deal stats
        </Link>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#0d1320] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${accent ? "text-profit" : ""}`}>{value}</p>
    </div>
  );
}
