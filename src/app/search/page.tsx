import Link from "next/link";
import { ListingCard } from "@/components/listings/ListingCard";
import { FilterSheet, FilterSidebar } from "@/components/search/Filters";
import { SaveSearchButton } from "@/components/search/SaveSearchButton";
import { parseSearchParams, toSearchParams } from "@/lib/search/params";
import { searchListings } from "@/lib/search/query";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import type { SearchParams } from "@/types/search";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params = parseSearchParams(raw);
  const [result, session] = await Promise.all([searchListings(params), getSession()]);

  return (
    <AppShell user={session}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Deals</p>
          <h1 className="mt-1 text-3xl font-semibold">{result.total.toLocaleString()} listings</h1>
        </div>
        <SaveSearchButton params={params} />
      </div>
      <div className="mb-4 lg:hidden">
        <FilterSheet values={params} />
      </div>
      <div className="flex gap-6">
        <FilterSidebar values={params} />
        <div className="min-w-0 flex-1">
          {result.items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-surface p-10 text-center text-slate-400">
              No listings matched those filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
          <Pagination params={params} page={result.page} pageCount={result.pageCount} />
        </div>
      </div>
    </AppShell>
  );
}

function Pagination({
  params,
  page,
  pageCount,
}: {
  params: SearchParams;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const prev = page > 1 ? toSearchParams({ ...params, page: page - 1 }) : null;
  const next = page < pageCount ? toSearchParams({ ...params, page: page + 1 }) : null;

  return (
    <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
      {prev ? <Link href={`/search?${prev.toString()}`}>Previous</Link> : <span />}
      <span>
        Page {page} of {pageCount}
      </span>
      {next ? <Link href={`/search?${next.toString()}`}>Next</Link> : <span />}
    </div>
  );
}
