import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-accent text-[11px] font-semibold tracking-wide text-accent-fg">
            L
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Lotline</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/search" className="hover:text-foreground">
            Search
          </Link>
          {session ? (
            <>
              <Link href="/account" className="hover:text-foreground">
                Account
              </Link>
              {session.role === "admin" ? (
                <Link href="/admin" className="hover:text-foreground">
                  Admin
                </Link>
              ) : null}
            </>
          ) : (
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          )}
          <Link
            href="/search"
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            Browse listings
          </Link>
        </nav>
      </div>
    </header>
  );
}
