"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, HelpCircle, LayoutDashboard, MapPin, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { LANDING_LOCATION } from "@/lib/landing";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-token";
import { cn } from "@/lib/utils";

export function WorkspaceShell({
  user,
  nav,
  children,
}: {
  user: SessionUser;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div data-dashboard className="flex min-h-screen bg-[#e8eef4] text-navy">
      <div className="hidden lg:flex">
        <WorkspaceSidebar user={user} nav={nav} />
      </div>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-[240px]">
            <WorkspaceSidebar user={user} nav={nav} onNavigate={() => setMenuOpen(false)} />
            <button
              type="button"
              className="absolute right-3 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          className="absolute left-4 top-5 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#071422] text-white lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <header className="relative z-30 flex h-[72px] items-center justify-between gap-4 bg-[#071422] px-6 pl-16 text-white lg:px-6">
          <form action="/mechanics" className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input
              name="q"
              placeholder="Search jobs, customers, or shops..."
              className="h-11 w-full rounded-full border border-white/15 bg-white/10 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45"
            />
          </form>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-sm text-white/80 md:inline-flex">
              <MapPin className="h-4 w-4 text-[#2f7bff]" />
              {LANDING_LOCATION}
            </span>
            <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15">
              <Bell className="h-4 w-4" />
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 py-1 pl-1 pr-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2f7bff] text-xs font-bold">
                {initials(user.firstName, user.lastName)}
              </span>
              <span className="hidden text-sm font-semibold sm:inline">
                {user.firstName} {user.lastName.charAt(0)}.
              </span>
            </span>
          </div>
        </header>
        <div className="flex-1 px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function WorkspaceSidebar({
  user,
  nav,
  onNavigate,
}: {
  user: SessionUser;
  nav: { href: string; label: string }[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const home = nav[0]?.href ?? "/";
  return (
    <aside className="flex w-[240px] shrink-0 flex-col bg-[#071422] text-white">
      <div className="px-5 py-5">
        <Logo light stacked />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((link) => {
          const active = pathname === link.href || (link.href !== home && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                active ? "bg-[#2f7bff] text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 pb-6">
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <HelpCircle className="h-4 w-4 text-[#2f7bff]" />
          Need Help?
        </p>
        <Link href="/how-it-works" className="mt-2 block text-sm text-white/65 hover:text-white">
          Help Center
        </Link>
        <p className="mt-6 text-[11px] text-white/45">
          Signed in as {user.firstName} · {user.role.toLowerCase()}
        </p>
      </div>
    </aside>
  );
}
