"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { CustomerSidebar } from "@/components/layout/customer-sidebar";
import { CustomerHeader } from "@/components/layout/customer-header";
import type { SessionUser } from "@/lib/session-token";

export function CustomerShell({
  user,
  location,
  unreadMessages,
  unreadNotifications,
  children,
}: {
  user: SessionUser;
  location: string;
  unreadMessages: number;
  unreadNotifications: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const overlay = pathname === "/home" || pathname === "/jobs";
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div data-dashboard className="flex min-h-screen bg-[#e8eef4] text-navy">
      <div className="hidden lg:flex">
        <CustomerSidebar unreadMessages={unreadMessages} />
      </div>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-[240px]">
        <CustomerSidebar unreadMessages={unreadMessages} onNavigate={() => setMenuOpen(false)} />
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
        <div className={overlay ? "relative flex-1" : "flex flex-1 flex-col"}>
          <button
            type="button"
            className="absolute left-4 top-5 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#071422] text-white lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <CustomerHeader user={user} location={location} unreadNotifications={unreadNotifications} overlay={overlay} />
          <div className={overlay ? "" : "flex-1 px-6 py-6"}>{children}</div>
        </div>
      </div>
    </div>
  );
}
