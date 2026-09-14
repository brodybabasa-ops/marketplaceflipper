"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  Car,
  ChevronDown,
  ClipboardList,
  DollarSign,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Receipt,
  Search,
  Settings,
  Star,
  Users,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { initials, shopInitials } from "@/lib/utils";
import { shopPhotoFor } from "@/lib/landing";
import { SHOP_NAV, shopSearchFor } from "@/lib/shop-os";
import type { SessionUser } from "@/lib/session-token";
import { cn } from "@/lib/utils";

type ShopInfo = {
  name: string;
  city: string | null;
  state: string | null;
  slug: string;
  photoUrl?: string | null;
};

export function ShopOsShell({
  user,
  shop,
  unreadNotifications = 0,
  unreadMessages = 0,
  children,
}: {
  user: SessionUser;
  shop: ShopInfo;
  unreadNotifications?: number;
  unreadMessages?: number;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div data-dashboard data-shop-os className="flex min-h-screen bg-[#f4f7fb] text-[#102033]">
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen">
        <ShopSidebar user={user} shop={shop} unreadMessages={unreadMessages} />
      </div>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-[248px]">
            <ShopSidebar user={user} shop={shop} unreadMessages={unreadMessages} onNavigate={() => setMenuOpen(false)} />
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#e6eef6] bg-white px-4 pl-16 lg:px-6 lg:pl-6">
          <button
            type="button"
            className="absolute left-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe3ec] text-[#102033] lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Suspense fallback={<div className="h-10 max-w-xl flex-1 rounded-xl border border-[#e6eef6] bg-[#f4f7fb]" />}>
            <ShopSearch />
          </Suspense>
          <Link
            href="/mechanic/notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6eef6] text-[#5c6b7a]"
            aria-label={unreadNotifications ? `${unreadNotifications} notifications` : "Notifications"}
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e23d3d] px-1 text-[10px] font-bold text-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            ) : null}
          </Link>
          <Link
            href="/how-it-works"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#e6eef6] text-[#5c6b7a] sm:inline-flex"
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4" />
          </Link>
          <div className="hidden items-center gap-2 rounded-xl py-1 pl-1 pr-2 sm:flex">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2f7bff] text-xs font-bold text-white">
              {initials(user.firstName, user.lastName)}
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-[#102033]">
                {user.firstName} {user.lastName.charAt(0)}.
              </span>
              <span className="block text-[11px] text-[#6b7c8d]">Shop Owner</span>
            </span>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="rounded-xl border border-[#dbe3ec] px-3 py-2 text-sm font-semibold text-[#5c6b7a] hover:bg-[#f4f7fb]">
              Sign out
            </button>
          </form>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function ShopSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const search = shopSearchFor(pathname);
  return (
    <form action={search.action} className="relative max-w-2xl flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a97a6]" />
      <input
        name="q"
        key={`${search.action}-${query}`}
        defaultValue={query}
        placeholder={search.placeholder}
        className="h-10 w-full rounded-xl border border-[#e6eef6] bg-[#f4f7fb] pl-10 pr-16 text-sm text-[#102033] outline-none placeholder:text-[#8a97a6] focus:border-[#2f7bff] focus:bg-white"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#e6eef6] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#8a97a6] sm:inline">
        ⌘K
      </span>
    </form>
  );
}

function ShopMark() {
  return (
    <Link href="/mechanic" className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[11px] bg-[#2f7bff] shadow-[0_6px_16px_rgba(47,123,255,0.35)]">
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
          <path
            fill="white"
            d="M9.2 6.8h8.1c4.35 0 7.7 2.85 7.7 6.95 0 4.15-3.35 7-7.7 7h-3.55V25.2H9.2V6.8zm4.55 4.15v5.55h3.35c1.95 0 3.15-1.1 3.15-2.75s-1.2-2.8-3.15-2.8h-3.35z"
          />
        </svg>
      </span>
      <span className="leading-[1.05] tracking-[0.18em] text-white">
        <span className="block text-[10px] font-extrabold">POCKET</span>
        <span className="block text-[10px] font-extrabold">MECHANIC</span>
      </span>
    </Link>
  );
}

function navIcon(href: string) {
  if (href.endsWith("/schedule")) return Calendar;
  if (href.endsWith("/estimates")) return FileText;
  if (href.endsWith("/jobs")) return Wrench;
  if (href.endsWith("/messages")) return MessageSquare;
  if (href.endsWith("/vehicles")) return Car;
  if (href.endsWith("/inventory")) return Package;
  if (href.endsWith("/invoicing")) return Receipt;
  if (href.endsWith("/reviews")) return Star;
  if (href.endsWith("/reports")) return BarChart3;
  if (href.endsWith("/earnings")) return DollarSign;
  if (href.endsWith("/team")) return UsersRound;
  if (href.endsWith("/settings")) return Settings;
  if (href.endsWith("/customers")) return Users;
  if (href === "/mechanic") return LayoutDashboard;
  return ClipboardList;
}

function ShopSidebar({
  user,
  shop,
  unreadMessages = 0,
  onNavigate,
}: {
  user: SessionUser;
  shop: ShopInfo;
  unreadMessages?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const location = [shop.city, shop.state].filter(Boolean).join(", ");
  const photo = shop.photoUrl || shopPhotoFor(shop.slug);
  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col overflow-y-auto bg-[#071422] text-white">
      <div className="px-5 py-5">
        <ShopMark />
      </div>
      <div className="mx-3 mb-4 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" className="h-10 w-10 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{shop.name}</p>
          <p className="truncate text-[11px] text-white/50">{location || "Shop workspace"}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-white/35" />
      </div>
      <nav className="flex-1 space-y-0.5 px-3 pb-4">
        {SHOP_NAV.map((link) => {
          const active =
            link.href === "/mechanic"
              ? pathname === "/mechanic"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = navIcon(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold",
                active ? "bg-[#2f7bff] text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{link.label}</span>
              {link.href.endsWith("/messages") && unreadMessages > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#e23d3d] px-1.5 text-[10px] font-bold text-white">
                  {unreadMessages}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-5">
        <div className="rounded-2xl bg-[linear-gradient(180deg,#1a2d44_0%,#122033_100%)] p-4">
          <p className="flex items-center gap-2 text-sm font-bold">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#f5c542] text-[11px]">★</span>
            Upgrade to Pro
          </p>
          <p className="mt-2 text-[12px] leading-5 text-white/55">Get advanced reporting, marketing tools, and more.</p>
          <Link
            href="/mechanic/settings?tab=billing"
            onClick={onNavigate}
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#2f7bff] text-sm font-bold text-white"
          >
            Upgrade Now
          </Link>
        </div>
        <p className="mt-3 px-1 text-[11px] text-white/35">
          {user.firstName} · {shopInitials(shop.name)}
        </p>
      </div>
    </aside>
  );
}
