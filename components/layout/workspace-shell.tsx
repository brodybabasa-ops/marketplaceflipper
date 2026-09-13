"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Calendar,
  Car,
  ClipboardList,
  DollarSign,
  FileText,
  HelpCircle,
  Inbox,
  LayoutDashboard,
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
import { signOutAction } from "@/app/actions/auth";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-token";
import { cn } from "@/lib/utils";

type Product = "shop" | "admin";

type PageCopy = {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
};

export function WorkspaceShell({
  user,
  nav,
  product,
  workspace,
  unreadNotifications = 0,
  children,
}: {
  user: SessionUser;
  nav: { href: string; label: string }[];
  product: Product;
  workspace: string;
  unreadNotifications?: number;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const page = opsPage(pathname, product);
  const inbox = product === "shop" ? "/mechanic/notifications" : "/admin/notifications";
  return (
    <div data-dashboard data-ops={product} className="flex min-h-screen bg-[#071422] text-white">
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen">
        <OpsSidebar user={user} nav={nav} product={product} workspace={workspace} />
      </div>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-[240px]">
            <OpsSidebar user={user} nav={nav} product={product} workspace={workspace} onNavigate={() => setMenuOpen(false)} />
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-[#071422] px-4 pl-16 lg:px-5 lg:pl-5">
          <button
            type="button"
            className="absolute left-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Suspense fallback={<div className="h-10 max-w-xl flex-1 rounded-lg border border-white/10 bg-white/5" />}>
            <OpsSearch pathname={pathname} product={product} />
          </Suspense>
          <Link
            href={inbox}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10"
            aria-label={unreadNotifications ? `${unreadNotifications} notifications` : "Notifications"}
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e23d3d]" />
            ) : null}
          </Link>
          <span className="hidden items-center gap-2 rounded-lg border border-white/10 py-1 pl-1 pr-3 sm:inline-flex">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#2f7bff] text-xs font-bold">
              {initials(user.firstName, user.lastName)}
            </span>
            <span className="text-sm font-semibold">
              {user.firstName} {user.lastName.charAt(0)}.
            </span>
          </span>
          <form action={signOutAction}>
            <button type="submit" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white">
              Sign out
            </button>
          </form>
        </header>
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[11px] font-bold tracking-[0.22em] text-[#2f7bff]">{page.eyebrow}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {page.title} <span className="text-[#2f7bff]">{page.accent}</span>
          </h1>
          <p className="mt-1.5 text-sm text-white/55">{page.subtitle}</p>
        </div>
        <div className="flex-1 px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function opsSearchFor(pathname: string, product: Product) {
  if (pathname.startsWith("/admin/users")) return { action: "/admin/users", placeholder: "Search users..." };
  if (pathname.startsWith("/admin/vehicles")) return { action: "/admin/vehicles", placeholder: "Search vehicles..." };
  if (pathname.startsWith("/admin/mechanics")) return { action: "/admin/mechanics", placeholder: "Search shops..." };
  if (pathname.startsWith("/mechanic/requests")) return { action: "/mechanic/requests", placeholder: "Search requests..." };
  if (product === "shop") return { action: "/mechanic/jobs", placeholder: "Search jobs or customers..." };
  return { action: "/admin/jobs", placeholder: "Search users, shops, or jobs..." };
}

function OpsSearch({ pathname, product }: { pathname: string; product: Product }) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const search = opsSearchFor(pathname, product);
  return (
    <form action={search.action} className="relative max-w-xl flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input
        name="q"
        key={`${search.action}-${query}`}
        defaultValue={query}
        placeholder={search.placeholder}
        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/40"
      />
    </form>
  );
}

function opsPage(pathname: string, product: Product): PageCopy {
  const shop: { prefix: string; page: PageCopy }[] = [
    { prefix: "/mechanic/requests", page: { eyebrow: "REQUESTS", title: "Incoming", accent: "Work.", subtitle: "Customers who asked this shop for help." } },
    { prefix: "/mechanic/jobs/new", page: { eyebrow: "JOBS", title: "New repair", accent: "Order.", subtitle: "Opens a live job, thread, and optional appointment." } },
    { prefix: "/mechanic/jobs", page: { eyebrow: "JOBS", title: "On the", accent: "Board.", subtitle: "Every request, estimate, and repair." } },
    { prefix: "/mechanic/schedule", page: { eyebrow: "SCHEDULER", title: "This week's", accent: "Book.", subtitle: "The same appointment times customers see." } },
    { prefix: "/mechanic/estimates", page: { eyebrow: "ESTIMATES", title: "Written", accent: "Quotes.", subtitle: "Sent to the customer on the live job." } },
    { prefix: "/mechanic/reviews", page: { eyebrow: "REVIEWS", title: "Job", accent: "Reviews.", subtitle: "Tied to completed Pocket Mechanic jobs." } },
    { prefix: "/mechanic/profile", page: { eyebrow: "PROFILE", title: "Shop", accent: "Profile.", subtitle: "What customers see before they request service." } },
    { prefix: "/mechanic/earnings", page: { eyebrow: "EARNINGS", title: "Job", accent: "Volume.", subtitle: "Totals from completed work. Payouts plug in later." } },
    { prefix: "/mechanic/settings", page: { eyebrow: "SETTINGS", title: "Shop", accent: "Settings.", subtitle: "Hours, notifications, and payouts." } },
    { prefix: "/mechanic/onboarding", page: { eyebrow: "SETUP", title: "Set up the", accent: "Shop.", subtitle: "Customers see this before they request service." } },
    { prefix: "/mechanic/customers", page: { eyebrow: "CUSTOMERS", title: "People you", accent: "Helped.", subtitle: "Customers attached to jobs at this shop." } },
    { prefix: "/mechanic/messages", page: { eyebrow: "MESSAGES", title: "Talk to the", accent: "Customer.", subtitle: "Conversations stay attached to the job." } },
    { prefix: "/mechanic/notifications", page: { eyebrow: "INBOX", title: "Shop", accent: "Alerts.", subtitle: "Requests, appointments, and estimate replies." } },
    { prefix: "/mechanic", page: { eyebrow: "SHOP COMMAND", title: "Today.", accent: "", subtitle: "Requests, the bay, and what is on the book." } },
  ];
  const admin: { prefix: string; page: PageCopy }[] = [
    { prefix: "/admin/users", page: { eyebrow: "USERS", title: "Platform", accent: "Accounts.", subtitle: "Customers, shops, and who can sign in." } },
    { prefix: "/admin/mechanics", page: { eyebrow: "SHOPS", title: "Listed", accent: "Shops.", subtitle: "Verification, score, and completed jobs." } },
    { prefix: "/admin/jobs", page: { eyebrow: "JOBS", title: "Every", accent: "Repair.", subtitle: "Customer to shop, with the current status." } },
    { prefix: "/admin/vehicles", page: { eyebrow: "VEHICLES", title: "Customer", accent: "Machines.", subtitle: "Every vehicle on file, tied to its owner." } },
    { prefix: "/admin/messages", page: { eyebrow: "MESSAGES", title: "Every", accent: "Thread.", subtitle: "Customer and shop conversations on live jobs." } },
    { prefix: "/admin/reviews", page: { eyebrow: "REVIEWS", title: "Job", accent: "Reviews.", subtitle: "Hide anything that should not stay public." } },
    { prefix: "/admin/disputes", page: { eyebrow: "DISPUTES", title: "Open", accent: "Issues.", subtitle: "Problems customers reported on completed work." } },
    { prefix: "/admin/verification", page: { eyebrow: "VERIFICATION", title: "Shop", accent: "Checks.", subtitle: "Approve or reject shop verification." } },
    { prefix: "/admin/analytics", page: { eyebrow: "ANALYTICS", title: "Live", accent: "Totals.", subtitle: "Jobs, estimates, messages, and upcoming work." } },
    { prefix: "/admin/notifications", page: { eyebrow: "INBOX", title: "Platform", accent: "Alerts.", subtitle: "Jobs and verification that need a look." } },
    { prefix: "/admin/settings", page: { eyebrow: "SETTINGS", title: "Platform", accent: "Config.", subtitle: "Commission, ranking, and adapter status." } },
    { prefix: "/admin", page: { eyebrow: "ADMIN", title: "Operations.", accent: "", subtitle: "Users, shops, jobs, and what needs a decision." } },
  ];
  const pages = product === "shop" ? shop : admin;
  return pages.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))?.page ?? pages[pages.length - 1].page;
}

function navIcon(href: string) {
  if (href.endsWith("/requests")) return Inbox;
  if (href.endsWith("/schedule")) return Calendar;
  if (href.endsWith("/estimates")) return FileText;
  if (href.endsWith("/jobs")) return Wrench;
  if (href.endsWith("/messages")) return MessageSquare;
  if (href.endsWith("/notifications")) return Bell;
  if (href.endsWith("/vehicles")) return Car;
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

function OpsSidebar({
  user,
  nav,
  product,
  workspace,
  onNavigate,
}: {
  user: SessionUser;
  nav: { href: string; label: string }[];
  product: Product;
  workspace: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const home = nav[0]?.href ?? "/";
  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#071422] text-white">
      <div className="px-5 py-5">
        <Logo light stacked />
        <p className="mt-3 text-[11px] font-bold tracking-[0.18em] text-[#2f7bff]">{product === "shop" ? "SHOP" : "ADMIN"}</p>
        <p className="mt-1 text-sm font-semibold leading-snug text-white/90">{workspace}</p>
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold",
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
        <p className="text-[11px] font-semibold tracking-[0.16em] text-white/40">
          {product === "shop" ? "WEBSITE COMMAND" : "WEBSITE OPS"}
        </p>
        <p className="mt-2 text-xs leading-5 text-white/45">
          {product === "shop"
            ? "Shops run the board here. Customers will live in the app."
            : "Admin stays on the website. Customers will live in the app."}
        </p>
        <Link href="/how-it-works" className="mt-3 inline-flex items-center gap-2 text-sm text-white/65 hover:text-white">
          <HelpCircle className="h-4 w-4 text-[#2f7bff]" />
          Help Center
        </Link>
        <p className="mt-4 text-[11px] text-white/40">
          {user.firstName} · {user.role.toLowerCase()}
        </p>
      </div>
    </aside>
  );
}
