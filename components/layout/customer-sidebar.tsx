"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Car,
  ClipboardList,
  Heart,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Settings,
  Star,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "My Vehicles", icon: Car },
  { href: "/jobs", label: "My Repairs", icon: Wrench },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/estimates", label: "Estimates", icon: ClipboardList },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/saved", label: "Saved Shops", icon: Heart },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/account", label: "Account Settings", icon: Settings },
];

export function CustomerSidebar({ unreadMessages, onNavigate }: { unreadMessages: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-[240px] shrink-0 flex-col bg-[#071422] text-white">
      <div className="px-5 py-5">
        <Logo light stacked />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {LINKS.map((link) => {
          const active = pathname === link.href || (link.href !== "/home" && pathname.startsWith(link.href));
          const Icon = link.icon;
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
      <div className="px-4 pb-4">
        <div className="overflow-hidden rounded-2xl bg-white/5 p-4">
          <p className="text-sm font-semibold">Take Pocket Mechanic on the go.</p>
          <Link
            href="/sign-up"
            className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-[#2f7bff] px-4 text-sm font-semibold text-white"
          >
            Get the App
          </Link>
          <p className="mt-2 text-[11px] text-white/45">Sign in on any phone. App Store listings are not live yet.</p>
        </div>
        <div className="mt-5 px-1">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            <HelpCircle className="h-4 w-4 text-[#2f7bff]" />
            Need Help?
          </p>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-white/65">
            <Link href="/how-it-works" className="hover:text-white">
              Help Center
            </Link>
            <Link href="/how-it-works" className="hover:text-white">
              Contact Support
            </Link>
            <Link href="/account" className="inline-flex items-center gap-2 hover:text-white">
              <LifeBuoy className="h-3.5 w-3.5" />
              Give Feedback
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4">
        <Logo light stacked className="scale-90 origin-left" />
        <p className="mt-2 text-[11px] text-white/45">Anything Mechanical. Anywhere.</p>
      </div>
    </aside>
  );
}
