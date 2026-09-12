"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  Calendar,
  Car,
  ChevronDown,
  CreditCard,
  Heart,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Wrench,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-token";

const NAV = [
  { href: "/mechanics", label: "Find a Shop" },
  { href: "/mechanics", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/for-mechanics", label: "For Mechanics" },
  { href: "/how-it-works", label: "About" },
];

const SIDEBAR = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "My Garage", icon: Car },
  { href: "/jobs", label: "My Repairs", icon: Wrench },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/saved", label: "Saved Shops", icon: Heart },
  { href: "/history", label: "Payments", icon: CreditCard },
  { href: "/account", label: "Settings", icon: Settings },
];

export function GarageShell({
  user,
  unreadMessages,
  children,
}: {
  user: SessionUser;
  unreadMessages: number;
  unreadNotifications?: number;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const messageCount = unreadMessages;
  return (
    <div data-dashboard className="flex min-h-screen flex-col bg-[#071422] text-white">
      <header className="sticky top-0 z-40 flex h-[72px] items-center gap-4 border-b border-white/5 bg-[#071422] px-4 lg:px-5">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo light stacked />
        <nav className="ml-8 hidden flex-1 items-center gap-7 text-[13px] font-medium text-white/80 xl:flex">
          {NAV.map((link) => (
            <Link key={link.label} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <form action="/mechanics" className="relative hidden w-[196px] sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
            <input
              name="q"
              placeholder="Search anything..."
              className="h-9 w-full rounded-full border border-white/15 bg-transparent pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/40"
            />
          </form>
          <Link href="/messages" className="inline-flex h-9 w-9 items-center justify-center text-white/80 hover:text-white" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Link>
          <Link href="/account" className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2f7bff] text-[11px] font-bold">
              {initials(user.firstName, user.lastName)}
            </span>
            <span className="hidden text-sm font-semibold sm:inline">{user.firstName}</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-white/50 sm:block" />
          </Link>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="hidden lg:sticky lg:top-[72px] lg:flex lg:h-[calc(100vh-72px)]">
          <GarageSidebar unreadMessages={messageCount} />
        </div>
        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
            <div className="relative h-full w-[220px] bg-[#071422]">
              <GarageSidebar unreadMessages={messageCount} onNavigate={() => setMenuOpen(false)} />
              <button
                type="button"
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function GarageSidebar({ unreadMessages, onNavigate }: { unreadMessages: number; onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-[#071422] text-white">
      <nav className="flex-1 space-y-1 px-3 pt-4">
        {SIDEBAR.map((link) => {
          const active = link.href === "/vehicles";
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                active ? "bg-[#1a334f] text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{link.label}</span>
              {link.href === "/messages" && unreadMessages > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#e23d3d] px-1.5 text-[10px] font-bold text-white">
                  {unreadMessages}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 pb-5 pt-6">
        <div className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/dashboard-hero.png" alt="" className="h-56 w-full object-cover object-[82%_18%]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,34,0.15)_0%,rgba(7,20,34,0.82)_55%,rgba(7,20,34,0.95)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-lg font-extrabold leading-tight">Keep your vehicles on track.</p>
            <p className="mt-1 text-[12px] leading-snug text-white/70">Maintenance, repairs, and records — all in one place.</p>
            <Link
              href="/vehicles/new"
              onClick={onNavigate}
              className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full bg-[#2f7bff] text-sm font-semibold text-white"
            >
              Add a Vehicle
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
