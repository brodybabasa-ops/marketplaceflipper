import Link from "next/link";
import { ListingCard } from "@/components/listings/ListingCard";
import { FilterSheet, FilterSidebar } from "@/components/search/Filters";
import { SaveSearchButton } from "@/components/search/SaveSearchButton";
import { parseSearchParams, toSearchParams } from "@/lib/search/params";
import { searchListings } from "@/lib/search/query";
import type { SearchParams } from "@/types/search";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params = parseSearchParams(raw);
  const result = await searchListings(params);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Results</p>
          <h1 className="mt-1 font-[family-name:var(--font-instrument)] text-4xl">
            {result.total.toLocaleString()} listings
          </h1>
        </div>
        <SaveSearchButton params={params} />
      </div>

      <div className="mb-4 lg:hidden">
        <FilterSheet values={params} />
      </div>

      <div className="flex gap-6">
        <FilterSidebar values={params} />
        <div className="min-w-0 flex-1 space-y-4">
          {result.items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center text-muted">
              No listings matched those filters.
            </div>
          ) : (
            result.items.map((listing) => <ListingCard key={listing.id} listing={listing} />)
          )}
          <Pagination params={params} page={result.page} pageCount={result.pageCount} />
        </div>
      </div>
    </div>
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
    <div className="flex items-center justify-between pt-2 text-sm">
      {prev ? (
        <Link href={`/search?${prev.toString()}`} className="text-muted hover:text-foreground">
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted">
        Page {page} of {pageCount}
      </span>
      {next ? (
        <Link href={`/search?${next.toString()}`} className="text-muted hover:text-foreground">
          Next
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
