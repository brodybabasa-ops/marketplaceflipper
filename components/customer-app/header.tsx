"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  ChevronDown,
  Heart,
  History,
  MapPin,
  Menu,
  MessageSquare,
  Settings,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { updateLocationAction } from "@/app/actions/account";
import { AppLogo } from "@/components/customer-app/primitives";
import { NEARBY_LOCATIONS } from "@/lib/customer-app";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-token";
import { cn } from "@/lib/utils";

const MENU_LINKS = [
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/saved", label: "Saved Shops", icon: Heart },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/history", label: "Repair History", icon: History },
  { href: "/account", label: "Settings", icon: Settings },
];

export function CustomerAppHeader({
  user,
  location,
  unreadNotifications,
  unreadMessages,
  avatarUrl,
}: {
  user: SessionUser;
  location: string;
  unreadNotifications: number;
  unreadMessages: number;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const home = pathname === "/home";
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setLocationOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 bg-[#071422]/95 px-4 backdrop-blur">
      <AppLogo />
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setLocationOpen((open) => !open);
            setProfileOpen(false);
            setMenuOpen(false);
          }}
          className="inline-flex max-w-[140px] items-center gap-1 rounded-full px-1.5 py-1 text-[13px] font-semibold text-white"
        >
          <MapPin className="h-3.5 w-3.5 text-[#2f7bff]" />
          <span className="truncate">{location}</span>
          <ChevronDown className="h-3.5 w-3.5 text-white/45" />
        </button>
        {home ? (
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
              setLocationOpen(false);
              setProfileOpen(false);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white"
            aria-label="Open menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        ) : (
          <>
            <Link
              href="/notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-white"
              aria-label={unreadNotifications ? `${unreadNotifications} notifications` : "Notifications"}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 ? (
                <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e23d3d] px-1 text-[9px] font-bold">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((open) => !open);
                setLocationOpen(false);
              }}
              className="overflow-hidden rounded-full ring-2 ring-white/15"
              aria-label="Profile menu"
            >
              <Avatar user={user} src={avatarUrl} />
            </button>
          </>
        )}
      </div>
      {locationOpen ? <LocationSheet location={location} onClose={() => setLocationOpen(false)} /> : null}
      {profileOpen ? (
        <ProfileSheet
          user={user}
          src={avatarUrl}
          unreadMessages={unreadMessages}
          onClose={() => setProfileOpen(false)}
        />
      ) : null}
      {menuOpen ? (
        <MenuSheet unreadMessages={unreadMessages} unreadNotifications={unreadNotifications} onClose={() => setMenuOpen(false)} />
      ) : null}
    </header>
  );
}

function Avatar({ user, src }: { user: SessionUser; src?: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="h-8 w-8 rounded-full object-cover" />
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2f7bff] text-[11px] font-bold text-white">
      {initials(user.firstName, user.lastName)}
    </span>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);
  return (
    <div className="absolute inset-x-3 top-[52px] z-50" ref={ref}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c1d30] shadow-2xl">{children}</div>
    </div>
  );
}

function LocationSheet({ location, onClose }: { location: string; onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <div className="p-3">
        <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-white/40">Location & service area</p>
        <form action={updateLocationAction} className="mt-3 space-y-2">
          <input
            name="location"
            defaultValue={location}
            placeholder="City or ZIP"
            className="h-10 w-full rounded-xl border border-white/10 bg-[#071422] px-3 text-sm text-white outline-none"
          />
          <button type="submit" className="h-10 w-full rounded-xl bg-[#2f7bff] text-sm font-semibold text-white">
            Update location
          </button>
        </form>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {NEARBY_LOCATIONS.map((item) => (
            <form key={item.zip} action={updateLocationAction}>
              <input type="hidden" name="location" value={item.zip} />
              <button
                type="submit"
                className={cn(
                  "h-9 w-full rounded-lg text-xs font-semibold",
                  location.includes(item.label.split(",")[0]) ? "bg-[#2f7bff] text-white" : "bg-white/5 text-white/75",
                )}
              >
                {item.label}
              </button>
            </form>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function ProfileSheet({
  user,
  src,
  unreadMessages,
  onClose,
}: {
  user: SessionUser;
  src?: string | null;
  unreadMessages: number;
  onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="p-3">
        <div className="flex items-center gap-3 px-1 py-1">
          <Avatar user={user} src={src} />
          <div>
            <p className="text-sm font-bold text-white">
              {user.firstName} {user.lastName.charAt(0)}.
            </p>
            <p className="text-xs text-white/45">{user.email}</p>
          </div>
        </div>
        <div className="mt-2 grid gap-0.5">
          {MENU_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-white/80 hover:bg-white/5"
              >
                <Icon className="h-4 w-4 text-[#2f7bff]" />
                <span className="flex-1">{link.label}</span>
                {link.href === "/messages" && unreadMessages > 0 ? (
                  <span className="rounded-full bg-[#e23d3d] px-1.5 text-[10px] font-bold text-white">{unreadMessages}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
        <form action={signOutAction} className="mt-2">
          <button type="submit" className="h-10 w-full rounded-xl text-sm font-semibold text-[#ff8b8b]">
            Log Out
          </button>
        </form>
      </div>
    </Sheet>
  );
}

function MenuSheet({
  unreadMessages,
  unreadNotifications,
  onClose,
}: {
  unreadMessages: number;
  unreadNotifications: number;
  onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <nav className="p-2">
        {MENU_LINKS.map((link) => {
          const Icon = link.icon;
          const badge =
            link.href === "/messages" ? unreadMessages : link.href === "/notifications" ? unreadNotifications : 0;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/5"
            >
              <Icon className="h-4 w-4 text-[#2f7bff]" />
              <span className="flex-1">{link.label}</span>
              {badge > 0 ? (
                <span className="rounded-full bg-[#e23d3d] px-1.5 text-[10px] font-bold text-white">{badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </Sheet>
  );
}
