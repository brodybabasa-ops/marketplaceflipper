"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Car,
  LayoutDashboard,
  MessageSquare,
  Search,
  Wrench,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import { homeForRole, type SessionUser } from "@/lib/session-token";
import { cn } from "@/lib/utils";
import { MECHANIC_SIDEBAR, hqNavFor, CUSTOMER_SIDEBAR_PRIMARY, CUSTOMER_SIDEBAR_SECONDARY } from "@/components/layout/nav-config";

function HeaderActions({ user, unreadCount }: { user: SessionUser | null; unreadCount: number }) {
  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <Link href="/notifications" className="relative rounded-full p-2 text-ink hover:bg-slate" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href={homeForRole(user.role)}>Dashboard</Link>
          </Button>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </>
      ) : (
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </>
      )}
    </div>
  );
}

export function SiteHeader({ user, unreadCount = 0 }: { user: SessionUser | null; unreadCount?: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-navy/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <Link href="/mechanics" className="hover:text-ink">
              Find a Mechanic
            </Link>
            <Link href="/how-it-works" className="hover:text-ink">
              How It Works
            </Link>
            <Link href="/for-mechanics" className="hover:text-ink">
              For Mechanics
            </Link>
            <Link href="/pocket-protect" className="hover:text-ink">
              Pocket Assurance
            </Link>
          </nav>
        </div>
        <HeaderActions user={user} unreadCount={unreadCount} />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-navy-soft">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">FIND. FIX. DRIVE ON.</p>
          <p className="mt-4 max-w-lg text-xs leading-5 text-muted">
            Pocket Mechanic connects customers with independent mechanical service providers. Automotive is the launch
            vertical. Boats, bikes, RVs, and equipment share the same trust network when you need them. Mechanics are
            independent and responsible for the services they perform. Pocket Assurance is a dispute workflow, not
            insurance.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Product</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
            <Link href="/mechanics">Find a mechanic</Link>
            <Link href="/mobile-mechanics">Mobile mechanics</Link>
            <Link href="/for-mechanics">Join as a mechanic</Link>
            <Link href="/pocket-protect">Pocket Assurance</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Legal placeholders</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
            <Link href="/legal/terms">Terms of Service</Link>
            <Link href="/legal/privacy">Privacy Policy</Link>
            <Link href="/legal/dispute-policy">Dispute Policy</Link>
            <Link href="/legal/review-policy">Review Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const CUSTOMER_BOTTOM = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/vehicles", label: "Garage", icon: Car },
  { href: "/fix", label: "Fix It", icon: Wrench },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/account", label: "Profile", icon: UserRound },
];

export function CustomerShell({
  user,
  unreadCount,
  children,
}: {
  user: SessionUser;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const path = usePathname();
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-navy lg:flex">
        <div className="border-b border-line px-4 py-5">
          <Logo />
          <p className="mt-3 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-muted">
            Whatever you own. Whatever’s wrong with it.
            <span className="mt-1 block text-accent">Fix It.</span>
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Customer">
          {CUSTOMER_SIDEBAR_PRIMARY.map((item) => {
            const href = item.href.split("#")[0];
            const active = item.href.includes("#")
              ? false
              : path === href || (href !== "/home" && path.startsWith(`${href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm font-medium",
                  active ? "bg-accent text-white" : "text-muted hover:bg-slate hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">More</p>
          {CUSTOMER_SIDEBAR_SECONDARY.map((item) => {
            const active = path === item.href || path.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm font-medium",
                  active ? "bg-slate text-ink" : "text-muted hover:bg-slate hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-4 py-4">
          <p className="text-sm font-semibold text-ink">
            {user.firstName} {user.lastName}
          </p>
          <Link href="/account" className="text-xs text-muted hover:text-accent">
            Profile & membership
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-navy/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="lg:hidden">
              <Logo compact={false} />
            </div>
            <p className="hidden text-sm text-muted lg:block">Whatever you own. Whatever’s wrong with it. Fix it.</p>
            <HeaderActions user={user} unreadCount={unreadCount} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 lg:pb-10">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-navy/95 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5">
            {CUSTOMER_BOTTOM.map((item) => {
              const active = path === item.href || (item.href !== "/home" && path.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("flex min-h-12 flex-col items-center justify-center gap-1 py-2 text-[11px]", active ? "text-accent" : "text-muted")}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function Sidebar({
  items,
  current,
  title,
}: {
  items: { href: string; label: string }[];
  current: string;
  title?: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-navy-soft md:flex md:flex-col">
      <div className="border-b border-line px-4 py-4">
        <Logo />
        {title ? <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{title}</p> : null}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => {
          const active =
            current === item.href ||
            (item.href !== "/mechanic" && item.href !== "/admin" && current.startsWith(`${item.href}/`)) ||
            current === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-xl px-3 py-2 text-sm font-medium",
                active ? "bg-accent text-white" : "text-muted hover:bg-slate hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MechanicShell({
  user,
  unreadCount,
  children,
}: {
  user: SessionUser;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const path = usePathname();
  return (
    <div className="flex min-h-full">
      <Sidebar items={MECHANIC_SIDEBAR} current={path} title="Pocket Mechanic PRO" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-line px-4">
          <p className="text-sm text-muted">
            {user.firstName} {user.lastName}
          </p>
          <HeaderActions user={user} unreadCount={unreadCount} />
        </header>
        <div className="flex-1 overflow-x-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}

export function HqShell({
  user,
  unreadCount,
  children,
}: {
  user: SessionUser;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const path = usePathname();
  return (
    <div className="flex min-h-full">
      <Sidebar items={hqNavFor(user.role)} current={path} title="Pocket Mechanic HQ" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line px-4">
          <form action="/admin/search" className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              name="q"
              placeholder="Search customers, providers, vehicles, jobs, payments…"
              className="h-10 w-full rounded-xl border border-line bg-navy pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </form>
          <HeaderActions user={user} unreadCount={unreadCount} />
        </header>
        <div className="flex-1 overflow-x-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}

export function AppChrome({
  user,
  unreadCount,
  children,
}: {
  user: SessionUser | null;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const customerApp =
    user?.role === "CUSTOMER" &&
    ["/home", "/vehicles", "/jobs", "/messages", "/history", "/account", "/request", "/intake", "/fix", "/inspect", "/help-now", "/fleet", "/wallet", "/saved", "/disputes", "/notifications", "/estimates", "/compare", "/mechanics"].some(
      (item) => path === item || path.startsWith(`${item}/`),
    );

  if (path.startsWith("/mechanic") && user) {
    return (
      <MechanicShell user={user} unreadCount={unreadCount}>
        {children}
      </MechanicShell>
    );
  }
  if (path.startsWith("/admin") && user) {
    return (
      <HqShell user={user} unreadCount={unreadCount}>
        {children}
      </HqShell>
    );
  }
  if (customerApp && user) {
    return (
      <CustomerShell user={user} unreadCount={unreadCount}>
        {children}
      </CustomerShell>
    );
  }
  return (
    <>
      <SiteHeader user={user} unreadCount={unreadCount} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
