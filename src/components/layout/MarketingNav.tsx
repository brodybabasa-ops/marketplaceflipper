import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { Logo } from "@/components/brand/Logo";

export async function MarketingNav() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#070b14]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
          <Link href="/search" className="hover:text-white">
            Search
          </Link>
          <Link href="/search?sort=dealScore" className="hover:text-white">
            Deals
          </Link>
          <Link href="/account" className="hover:text-white">
            My Searches
          </Link>
          <Link href="/account" className="hover:text-white">
            Alerts
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/search" className="rounded-xl px-4 py-2 text-sm text-slate-200 hover:text-white">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="rounded-xl px-4 py-2 text-sm text-slate-200 hover:text-white">
              Log in
            </Link>
          )}
          <Link
            href={session ? "/account" : "/register"}
            className="btn-signup rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg shadow-purple-500/20"
          >
            {session ? "Account" : "Sign up"}
          </Link>
        </div>
      </div>
    </header>
  );
}
