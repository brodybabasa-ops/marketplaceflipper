import type { ReactNode, ComponentType } from "react";
import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { Logo } from "@/components/brand/Logo";
import {
  Bell,
  Bookmark,
  Calculator,
  Heart,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/search", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/search?sort=dealScore", label: "Deals", icon: Sparkles },
  { href: "/account", label: "Alerts", icon: Bell },
  { href: "/account", label: "Favorites", icon: Heart },
];

const TOOLS = [
  { href: "/search?sort=dealScore", label: "Deal Analyzer", icon: TrendingUp },
  { href: "/search", label: "Profit Calculator", icon: Calculator },
];

export function AppShell({
  children,
  user,
  rightRail,
}: {
  children: ReactNode;
  user: SessionUser | null;
  rightRail?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/5 bg-[#0a101c] px-4 py-5 lg:flex lg:flex-col">
        <Logo />
        <nav className="mt-8 space-y-1 text-sm">
          {NAV.map((item) => (
            <NavLink key={item.label} {...item} />
          ))}
        </nav>
        <p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Tools
        </p>
        <nav className="mt-2 space-y-1 text-sm">
          {TOOLS.map((item) => (
            <NavLink key={item.label} {...item} />
          ))}
        </nav>
        <p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Account
        </p>
        <nav className="mt-2 space-y-1 text-sm">
          <NavLink href="/account" label="Saved Searches" icon={Bookmark} />
          <NavLink href="/account" label="Settings" icon={Settings} />
          {user?.role === "admin" ? (
            <NavLink href="/admin" label="Admin" icon={LayoutDashboard} />
          ) : null}
        </nav>
        <div className="mt-auto rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 p-4 text-sm">
          <p className="font-semibold">FlipFinder Pro</p>
          <p className="mt-1 text-xs text-white/80">Faster alerts and deeper deal scores.</p>
          <Link
            href="/register"
            className="mt-3 inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
          >
            Upgrade to Pro
          </Link>
        </div>
      </aside>

      <div className={cn("lg:pl-64", rightRail ? "xl:pr-80" : "")}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-[#070b14]/85 px-4 backdrop-blur-xl">
          <form action="/search" className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              name="keyword"
              placeholder="Search Marketplace deals"
              className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-14 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">
              ⌘K
            </span>
          </form>
          <div className="ml-4 flex items-center gap-3">
            <Link href="/account" className="relative rounded-full p-2 text-slate-300 hover:bg-white/5">
              <Bell className="h-4 w-4" />
            </Link>
            {user ? (
              <Link href="/account" className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-profit text-xs font-bold text-[#042f1e]">
                  {initials(user.name || user.email)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium">{user.name || "Member"}</span>
                  <span className="block text-[11px] text-profit">Pro Member</span>
                </span>
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-slate-300">
                Log in
              </Link>
            )}
          </div>
        </header>
        <div className="px-4 py-6 lg:px-8">{children}</div>
      </div>

      {rightRail ? (
        <aside className="fixed inset-y-0 right-0 hidden w-80 overflow-y-auto border-l border-white/5 bg-[#0a101c] p-5 xl:block">
          {rightRail}
        </aside>
      ) : null}
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function initials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
