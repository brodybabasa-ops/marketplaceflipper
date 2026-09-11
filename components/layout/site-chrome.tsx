"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, MapPin, Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import { LANDING_LOCATION } from "@/lib/landing";
import type { SessionUser } from "@/lib/session-token";

function dashboardFor(role: SessionUser["role"]) {
  if (role === "MECHANIC") return "/mechanic";
  if (role === "ADMIN") return "/admin";
  return "/home";
}

const LANDING_LINKS = [
  { href: "/mechanics", label: "Find a Shop" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/#vehicles", label: "Vehicles" },
  { href: "/mechanics", label: "Services" },
  { href: "/for-mechanics", label: "For Shops" },
];

const RESOURCE_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pocket-protect", label: "Pocket Protect" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
];

export function SiteHeader({ user }: { user: SessionUser | null }) {
  return (
    <>
      <LandingHeader user={user} />
      <AppHeader user={user} />
    </>
  );
}

function AppHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="app-header sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <Link href="/mechanics" className="hover:text-navy">
              Find a Mechanic
            </Link>
            <Link href="/how-it-works" className="hover:text-navy">
              How It Works
            </Link>
            <Link href="/for-mechanics" className="hover:text-navy">
              For Mechanics
            </Link>
            <Link href="/pocket-protect" className="hover:text-navy">
              Pocket Protect
            </Link>
          </nav>
        </div>
        <AuthButtons user={user} />
      </div>
    </header>
  );
}

function LandingHeader({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <header className="landing-header absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-4 sm:px-6">
        <Logo light stacked />
        <nav className="hidden items-center gap-6 text-[13px] font-medium text-white/80 lg:flex">
          {LANDING_LINKS.map((link) => (
            <Link key={`${link.href}-${link.label}`} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-white"
              onClick={() => setResourcesOpen((value) => !value)}
              onBlur={() => window.setTimeout(() => setResourcesOpen(false), 150)}
            >
              Resources
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {resourcesOpen ? (
              <div className="absolute left-0 top-full mt-2 min-w-44 rounded-xl border border-white/10 bg-[#0b1a2c] p-2 shadow-xl">
                {RESOURCE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1.5 text-sm text-white/80 md:inline-flex">
            <MapPin className="h-4 w-4 text-[#2f7bff]" />
            {LANDING_LOCATION}
          </span>
          <div className="hidden sm:block">
            <LandingAuth user={user} />
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-white/10 bg-[#071422]/95 px-4 py-4 backdrop-blur lg:hidden">
          <div className="flex flex-col gap-3 text-sm text-white/85">
            {LANDING_LINKS.map((link) => (
              <Link key={`${link.href}-${link.label}-m`} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            {RESOURCE_LINKS.map((link) => (
              <Link key={`${link.href}-m`} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <LandingAuth user={user} />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function LandingAuth({ user }: { user: SessionUser | null }) {
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={dashboardFor(user.role)}
          className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Dashboard
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="rounded-full bg-[#2f7bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f7bff]/90">
            Sign out
          </button>
        </form>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/sign-in"
        className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
      >
        Log In
      </Link>
      <Link
        href="/sign-up"
        className="rounded-full bg-[#2f7bff] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,123,255,0.35)] hover:bg-[#2568e8]"
      >
        Get the App
      </Link>
    </div>
  );
}

function AuthButtons({ user }: { user: SessionUser | null }) {
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={dashboardFor(user.role)}>Dashboard</Link>
        </Button>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/sign-in">Sign In</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-up">Get Started</Link>
      </Button>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="app-footer mt-auto border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">Your vehicle. Your mechanic. Your peace of mind.</p>
          <p className="mt-4 max-w-lg text-xs leading-5 text-muted">
            Pocket Mechanic connects customers with independent automotive service providers. Mechanics are independent
            service providers and are responsible for the services they perform.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy">Product</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
            <Link href="/mechanics">Find a mechanic</Link>
            <Link href="/mobile-mechanics">Mobile mechanics</Link>
            <Link href="/for-mechanics">Join as a mechanic</Link>
            <Link href="/pocket-protect">Pocket Protect</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy">Legal placeholders</p>
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
