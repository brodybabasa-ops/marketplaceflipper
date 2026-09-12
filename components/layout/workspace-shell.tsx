"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ClipboardList,
  DollarSign,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Star,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { KeepRunningBar } from "@/components/layout/keep-running-bar";
import { LANDING_LOCATION } from "@/lib/landing";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-token";
import { cn } from "@/lib/utils";

type HeroCopy = {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  script: string;
  image: string;
};

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
  const pathname = usePathname();
  const hero = workspaceHero(pathname, user);
  return (
    <div data-dashboard className="flex min-h-screen bg-[#e8eef4] text-navy">
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen">
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
      <div className="relative flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          className="absolute left-4 top-5 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#071422] text-white lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <header className="absolute inset-x-0 top-0 z-30 flex h-[72px] items-center justify-between gap-4 px-6 pl-16 text-white lg:px-6">
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
        <section className="relative overflow-hidden bg-[#071422] pb-16 pt-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[78%_center]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.94)_0%,rgba(7,20,34,0.72)_40%,rgba(7,20,34,0.22)_100%)]" />
          <div className="relative w-full px-8 lg:px-9">
            <p className="text-xs font-semibold tracking-[0.22em] text-white/75">{hero.eyebrow}</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              {hero.title} <span className="text-[#2f7bff]">{hero.accent}</span>
            </h1>
            <p className="mt-3 max-w-lg text-white/75">{hero.subtitle}</p>
            <p className="font-script mt-4 text-2xl text-white/90">{hero.script}</p>
          </div>
        </section>
        <div className="relative z-10 -mt-8 w-full flex-1 px-3 pb-12 lg:px-4">
          <div className="overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_18px_40px_rgba(14,28,47,0.10)] sm:p-6">
            {children}
          </div>
        </div>
        <KeepRunningBar />
      </div>
    </div>
  );
}

function workspaceHero(pathname: string, user: SessionUser): HeroCopy {
  const heroes: { prefix: string; hero: HeroCopy }[] = [
    {
      prefix: "/mechanic/requests",
      hero: {
        eyebrow: "REQUESTS",
        title: "Incoming",
        accent: "Work.",
        subtitle: "Customers who asked this shop for help.",
        script: "Get work. Get it done.",
        image: "/landing/shop-diesel.png",
      },
    },
    {
      prefix: "/mechanic/jobs",
      hero: {
        eyebrow: "JOBS",
        title: "Shop",
        accent: "Jobs.",
        subtitle: "Every request, estimate, and repair on the board.",
        script: "Get it Fixed.",
        image: "/landing/shop-1.png",
      },
    },
    {
      prefix: "/mechanic/reviews",
      hero: {
        eyebrow: "REVIEWS",
        title: "What customers",
        accent: "Said.",
        subtitle: "Reviews only come from completed Pocket Mechanic jobs.",
        script: "Real People. Real Repairs.",
        image: "/landing/lifestyle.png",
      },
    },
    {
      prefix: "/mechanic/profile",
      hero: {
        eyebrow: "PROFILE",
        title: "Your",
        accent: "Shop.",
        subtitle: "What customers see before they request service.",
        script: "Earn the work.",
        image: "/landing/shop-2.png",
      },
    },
    {
      prefix: "/mechanic/earnings",
      hero: {
        eyebrow: "EARNINGS",
        title: "Job",
        accent: "Volume.",
        subtitle: "Totals from completed jobs. Payouts plug in later.",
        script: "Keep It Running.",
        image: "/landing/dashboard-hero.png",
      },
    },
    {
      prefix: "/mechanic/settings",
      hero: {
        eyebrow: "SETTINGS",
        title: "Shop",
        accent: "Settings.",
        subtitle: "Notifications and payouts will live here.",
        script: "Stay in the Loop.",
        image: "/landing/lifestyle.png",
      },
    },
    {
      prefix: "/mechanic/onboarding",
      hero: {
        eyebrow: "ONBOARDING",
        title: "Set up your",
        accent: "Profile.",
        subtitle: "Customers see this before they request service.",
        script: "Earn the work.",
        image: "/landing/shop-3.png",
      },
    },
    {
      prefix: "/mechanic/customers",
      hero: {
        eyebrow: "CUSTOMERS",
        title: "People you",
        accent: "Helped.",
        subtitle: "Customers attached to jobs at this shop.",
        script: "Real People. Real Repairs.",
        image: "/landing/lifestyle.png",
      },
    },
    {
      prefix: "/mechanic/messages",
      hero: {
        eyebrow: "MESSAGES",
        title: "Talk to the",
        accent: "Customer.",
        subtitle: "Conversations stay attached to the job.",
        script: "Stay in the Loop.",
        image: "/landing/lifestyle.png",
      },
    },
    {
      prefix: "/mechanic",
      hero: {
        eyebrow: "SHOP COMMAND",
        title: "Good morning,",
        accent: `${user.firstName}.`,
        subtitle: "Requests, jobs, and the work on the board today.",
        script: "Keep It Running.",
        image: "/landing/shop-diesel.png",
      },
    },
    {
      prefix: "/admin/users",
      hero: {
        eyebrow: "USERS",
        title: "Platform",
        accent: "Accounts.",
        subtitle: "Customers, shops, and who can sign in.",
        script: "Keep It Running.",
        image: "/landing/dashboard-hero.png",
      },
    },
    {
      prefix: "/admin/mechanics",
      hero: {
        eyebrow: "SHOPS",
        title: "Listed",
        accent: "Shops.",
        subtitle: "Verification, score, and completed jobs.",
        script: "Find the Right Shop.",
        image: "/landing/shop-1.png",
      },
    },
    {
      prefix: "/admin/jobs",
      hero: {
        eyebrow: "JOBS",
        title: "Every",
        accent: "Repair.",
        subtitle: "Customer to shop, with the current status.",
        script: "Stay in the Loop.",
        image: "/landing/repairs-hero.png",
      },
    },
    {
      prefix: "/admin/reviews",
      hero: {
        eyebrow: "REVIEWS",
        title: "Job",
        accent: "Reviews.",
        subtitle: "Hide anything that should not stay public.",
        script: "Real People. Real Repairs.",
        image: "/landing/lifestyle.png",
      },
    },
    {
      prefix: "/admin/disputes",
      hero: {
        eyebrow: "DISPUTES",
        title: "Open",
        accent: "Issues.",
        subtitle: "Problems customers reported on completed work.",
        script: "No surprises.",
        image: "/landing/shop-2.png",
      },
    },
    {
      prefix: "/admin/verification",
      hero: {
        eyebrow: "VERIFICATION",
        title: "Shop",
        accent: "Checks.",
        subtitle: "Approve or reject shop verification requests.",
        script: "Verified Shops.",
        image: "/landing/shop-3.png",
      },
    },
    {
      prefix: "/admin/settings",
      hero: {
        eyebrow: "SETTINGS",
        title: "Platform",
        accent: "Config.",
        subtitle: "Commission, ranking, and adapter status.",
        script: "Keep It Running.",
        image: "/landing/lifestyle.png",
      },
    },
    {
      prefix: "/admin",
      hero: {
        eyebrow: "ADMIN",
        title: "Platform",
        accent: "Overview.",
        subtitle: "Users, shops, jobs, and open disputes.",
        script: "Keep It Running.",
        image: "/landing/dashboard-hero.png",
      },
    },
  ];
  return heroes.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))?.hero ?? heroes[heroes.length - 1].hero;
}

function navIcon(href: string) {
  if (href.endsWith("/requests")) return Inbox;
  if (href.endsWith("/jobs")) return Wrench;
  if (href.endsWith("/messages")) return MessageSquare;
  if (href.endsWith("/reviews")) return Star;
  if (href.endsWith("/profile")) return User;
  if (href.endsWith("/earnings")) return DollarSign;
  if (href.endsWith("/settings")) return Settings;
  if (href.endsWith("/users")) return Users;
  if (href.endsWith("/mechanics")) return Wrench;
  if (href.endsWith("/disputes")) return AlertTriangle;
  if (href.endsWith("/verification")) return ShieldCheck;
  if (href.endsWith("/analytics")) return BarChart3;
  if (href.includes("/customers")) return Users;
  if (href === "/mechanic" || href === "/admin") return LayoutDashboard;
  return ClipboardList;
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
    <aside className="flex h-full w-[240px] shrink-0 flex-col overflow-y-auto bg-[#071422] text-white">
      <div className="px-5 py-5">
        <Logo light stacked />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((link) => {
          const active = pathname === link.href || (link.href !== home && pathname.startsWith(link.href));
          const Icon = navIcon(link.href);
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
              <Icon className="h-4 w-4" />
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
