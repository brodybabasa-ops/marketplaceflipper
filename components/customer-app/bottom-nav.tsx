"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Calendar, Car, Heart, Home, MessageSquare, Search, UserRound, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: typeof Home; match: (path: string) => boolean };

const CORE: Tab[] = [
  { href: "/home", label: "Home", icon: Home, match: (path) => path === "/home" },
  { href: "/mechanics", label: "Find", icon: Search, match: (path) => path.startsWith("/mechanics") || path === "/search" },
  { href: "/vehicles", label: "Garage", icon: Car, match: (path) => path.startsWith("/vehicles") },
  { href: "/jobs", label: "Repairs", icon: Wrench, match: (path) => path.startsWith("/jobs") || path.startsWith("/requests") || path.startsWith("/history") || path.startsWith("/estimates") },
  { href: "/account", label: "Account", icon: UserRound, match: (path) => path.startsWith("/account") || path.startsWith("/reviews") },
];

const SWAP: Record<string, Tab> = {
  "/appointments": { href: "/appointments", label: "Appointments", icon: Calendar, match: (path) => path.startsWith("/appointments") },
  "/saved": { href: "/saved", label: "Saved", icon: Heart, match: (path) => path.startsWith("/saved") },
  "/messages": { href: "/messages", label: "Messages", icon: MessageSquare, match: (path) => path.startsWith("/messages") },
  "/notifications": { href: "/notifications", label: "Notifications", icon: Bell, match: (path) => path.startsWith("/notifications") },
};

export function CustomerBottomNav({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const pathname = usePathname();
  const swapKey = Object.keys(SWAP).find((key) => pathname.startsWith(key));
  const tabs = CORE.map((tab, index) => {
    if (index === 3 && swapKey) return SWAP[swapKey];
    return tab;
  });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] border-t border-white/10 bg-[#071422]/95 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur">
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn("flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold", active ? "text-[#2f7bff]" : "text-white/40")}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                {tab.href === "/notifications" && unreadNotifications > 0 ? (
                  <span className="absolute -right-2 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e23d3d] px-1 text-[9px] font-bold text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                ) : null}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
