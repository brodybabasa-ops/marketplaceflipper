import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Lotline is a search layer. Transactions happen on the original marketplace.</p>
        <div className="flex gap-4">
          <Link href="/search" className="hover:text-foreground">
            Search
          </Link>
          <Link href="/account" className="hover:text-foreground">
            Saved searches
          </Link>
        </div>
      </div>
    </footer>
  );
}
