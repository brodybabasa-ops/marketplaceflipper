import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { DealBadge } from "@/components/listings/DealBadge";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { OpenOnMarketplace } from "@/components/listings/OpenOnMarketplace";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { dealScoreLabel } from "@/lib/scoring/deal-score";
import { dealSnapshot } from "@/lib/marketplace";
import {
  formatLocation,
  formatMiles,
  isVehicleListing,
  listingTitle,
  sourceLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      priceHistory: { orderBy: { recordedAt: "asc" } },
      duplicateOf: true,
    },
  });
  if (!listing) notFound();

  const session = await getSession();
  const favorited = session
    ? Boolean(
        await prisma.favorite.findUnique({
          where: { userId_listingId: { userId: session.id, listingId: listing.id } },
        }),
      )
    : false;

  const title = listingTitle(listing);
  const vehicle = isVehicleListing(listing);
  const snapshot = dealSnapshot(listing);
  const breakdown = listing.dealScoreBreakdown as {
    reasons?: string[];
    hasMarketData?: boolean;
    price?: number;
    mileage?: number;
    freshness?: number;
    completeness?: number;
  } | null;

  return (
    <AppShell user={session}>
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {listing.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.imageUrls[0]} alt={title} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="aspect-[16/10] bg-[#ece7dc]" />
            )}
            {listing.imageUrls.length > 1 ? (
              <div className="grid grid-cols-4 gap-1 p-1">
                {listing.imageUrls.slice(1, 5).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-8">
            <h1 className="text-4xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-muted">
              {[listing.category, vehicle ? formatMiles(listing.mileage) : listing.condition, formatLocation(listing.city, listing.state)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Spec label="Category" value={listing.category} />
            <Spec label={vehicle ? "Make" : "Brand"} value={listing.normalizedMake} />
            <Spec label="Model" value={listing.normalizedModel} />
            {vehicle ? (
              <>
                <Spec label="Year" value={listing.year} />
                <Spec label="Trim" value={listing.normalizedTrim} />
                <Spec label="Mileage" value={listing.mileage != null ? formatMiles(listing.mileage) : null} />
                <Spec label="Drivetrain" value={listing.drivetrain} />
                <Spec label="Transmission" value={listing.transmission} />
                <Spec label="Fuel" value={listing.fuelType} />
                <Spec label="Body" value={listing.bodyStyle} />
                <Spec label="Engine" value={listing.engine} />
              </>
            ) : (
              <Spec label="Details" value={listing.normalizedTrim} />
            )}
            <Spec label="Condition" value={listing.condition} />
            <Spec label="Seller" value={listing.sellerType} />
            <Spec
              label="Normalized confidence"
              value={
                listing.normalizationConfidence != null
                  ? `${Math.round(listing.normalizationConfidence * 100)}%`
                  : null
              }
            />
          </dl>

          {listing.description ? (
            <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">
                {listing.description}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Asking price</p>
            <p className="mt-1 text-3xl font-semibold">{snapshot.ask}</p>
            <div className="mt-3">
              <DealBadge score={listing.dealScore} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/8 bg-[#0d1320] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Est. market</p>
                <p className="mt-1 font-semibold">{snapshot.market}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#0d1320] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Est. profit</p>
                <p className="mt-1 font-semibold text-profit">{snapshot.profit}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#0d1320] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Margin</p>
                <p className="mt-1 font-semibold">{snapshot.margin}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#0d1320] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Comps</p>
                <p className="mt-1 font-semibold">{snapshot.comps || "—"}</p>
              </div>
            </div>
            <OpenOnMarketplace listing={listing} className="mt-5" />
            <FavoriteButton listingId={listing.id} initial={favorited} />
            <p className="mt-3 text-xs leading-5 text-muted">
              FlipFinder scores the deal. You message the seller on {sourceLabel(listing.source === "mock" ? "facebook" : listing.source)}.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
            <h2 className="font-semibold">Deal score</h2>
            <p className="mt-1 text-muted">
              {listing.dealScore != null
                ? `${listing.dealScore}/100 — ${dealScoreLabel(listing.dealScore)}`
                : "Unscored"}
            </p>
            <div className="mt-4 space-y-2">
              <ScoreBar label="Price vs comps" value={breakdown?.price} max={50} />
              <ScoreBar label="Freshness" value={breakdown?.freshness} max={10} />
              <ScoreBar label="Completeness" value={breakdown?.completeness} max={10} />
            </div>
            <ul className="mt-3 space-y-1 text-muted">
              {(breakdown?.reasons ?? []).map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Relative attractiveness versus comparable listings in this catalog. Not a guarantee.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
            <p>Source: {sourceLabel(listing.source)}</p>
            <p>First seen: {listing.firstSeenAt.toLocaleDateString()}</p>
            <p>Last updated: {listing.updatedAt.toLocaleDateString()}</p>
            {listing.duplicateOf.length > 0 ? (
              <p className="mt-2">Possible duplicate flagged ({listing.duplicateOf.length})</p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
    </AppShell>
  );
}

function Spec({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  max,
}: {
  label: string;
  value?: number;
  max: number;
}) {
  const pct = Math.max(0, Math.min(100, ((value ?? 0) / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>{label}</span>
        <span>{value ?? 0}/{max}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
          style={{ width: `${Math.max(6, pct)}%` }}
        />
      </div>
    </div>
  );
}
