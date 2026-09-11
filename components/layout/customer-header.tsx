"use client";

import Link from "next/link";
import { Bell, MapPin, Search } from "lucide-react";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-token";
import { cn } from "@/lib/utils";

export function CustomerHeader({
  user,
  location,
  unreadNotifications,
  overlay,
}: {
  user: SessionUser;
  location: string;
  unreadNotifications: number;
  overlay?: boolean;
}) {
  return (
    <header
      className={cn(
        "z-30 flex h-[72px] items-center justify-between gap-4 px-6",
        overlay ? "absolute inset-x-0 top-0 pl-16 lg:px-6" : "relative bg-[#071422] text-white pl-16 lg:px-6",
      )}
    >
      <form action="/mechanics" className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
        <input
          name="q"
          placeholder="Search for shops, services, or anything..."
          className="h-11 w-full rounded-full border border-white/15 bg-white/10 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45"
        />
      </form>
      <div className="flex items-center gap-3 text-white">
        <span className="hidden items-center gap-1.5 text-sm text-white/80 md:inline-flex">
          <MapPin className="h-4 w-4 text-[#2f7bff]" />
          {location}
        </span>
        <Link
          href="/messages"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
          aria-label={unreadNotifications ? `${unreadNotifications} notifications` : "Notifications"}
        >
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e23d3d]" />
          ) : null}
        </Link>
        <Link href="/account" className="inline-flex items-center gap-2 rounded-full border border-white/15 py-1 pl-1 pr-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2f7bff] text-xs font-bold">
            {initials(user.firstName, user.lastName)}
          </span>
          <span className="hidden text-sm font-semibold sm:inline">
            {user.firstName} {user.lastName.charAt(0)}.
          </span>
        </Link>
      </div>
    </header>
  );
}
