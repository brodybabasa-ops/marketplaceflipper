"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Car,
  ChevronRight,
  CreditCard,
  FileText,
  Heart,
  HelpCircle,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Scale,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { AccountForm } from "@/components/account/account-form";
import { AppCard } from "@/components/customer-app/primitives";
import { initials } from "@/lib/utils";

export function CustomerSettingsView({
  firstName,
  lastName,
  email,
  phone,
  zip,
  location,
  avatarUrl,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zip: string;
  location: string;
  avatarUrl?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="px-4 pt-2">
      <h1 className="text-[28px] font-extrabold tracking-tight text-white">Settings</h1>
      <p className="mt-1 text-sm text-white/55">Manage your account, preferences, and more.</p>

      <AppCard className="mt-5 p-4">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#2f7bff] text-lg font-bold">
              {initials(firstName, lastName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-lg font-extrabold text-white">
              {firstName} {lastName.charAt(0)}.
            </p>
            <p className="text-sm text-white/50">{email}</p>
            {phone ? <p className="text-sm text-white/50">{phone}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setEditing((open) => !open)}
            className="rounded-full border border-[#2f7bff]/40 px-3 py-1.5 text-xs font-bold text-[#7eb0ff]"
          >
            Edit Profile
          </button>
        </div>
        {editing ? (
          <div className="mt-4 rounded-2xl bg-white p-4 text-navy">
            <AccountForm firstName={firstName} lastName={lastName} email={email} phone={phone} zip={zip} />
          </div>
        ) : null}
      </AppCard>

      <Section title="Account">
        <Row href="#profile" icon={User} title="Personal Information" body="Name, email, phone, profile photo" onClick={() => setEditing(true)} />
        <Row href="/vehicles" icon={Car} title="Vehicles" body="Manage your garage and default vehicle" />
        <Row href="/saved" icon={Heart} title="Saved Shops" body="View and manage your saved shops" />
        <Row href="/account/payments" icon={CreditCard} title="Payment Methods" body="Cards, financing, and payment settings" />
      </Section>

      <Section title="Preferences">
        <Row href="/account/notifications" icon={Bell} title="Notifications" body="Manage what you want to be notified about" />
        <Row href="/account/preferences" icon={Settings} title="App Preferences" body="Language, appearance, units (miles/km), etc." />
        <Row href="/account/location" icon={MapPin} title="Location & Service Area" body={`${location} (edit)`} />
      </Section>

      <Section title="Support">
        <Row href="/how-it-works" icon={HelpCircle} title="Help Center" body="FAQs, guides, and support resources" />
        <Row href="/how-it-works" icon={MessageSquare} title="Contact Support" body="Get in touch with our team" />
        <Row href="/account/report" icon={Shield} title="Report an Issue" body="Report a bug or submit feedback" />
      </Section>

      <Section title="Legal">
        <Row href="/legal/terms" icon={FileText} title="Terms of Service" />
        <Row href="/legal/privacy" icon={Lock} title="Privacy Policy" />
        <Row href="/legal/terms" icon={Scale} title="Licenses & Attributions" />
      </Section>

      <div className="mt-5">
        {confirm ? (
          <div className="rounded-2xl border border-[#e23d3d]/30 bg-[#2a1216] p-4">
            <p className="text-sm font-semibold text-white">Log out of Pocket Mechanic?</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setConfirm(false)} className="h-10 flex-1 rounded-full border border-white/15 text-sm font-semibold">
                Cancel
              </button>
              <form action={signOutAction} className="flex-1">
                <button type="submit" className="h-10 w-full rounded-full bg-[#e23d3d] text-sm font-bold text-white">
                  Log Out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#e23d3d]/40 text-sm font-bold text-[#ff8b8b]"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-sm font-bold text-white/45">{title}</h2>
      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0c1d30]">{children}</div>
    </section>
  );
}

function Row({
  href,
  icon: Icon,
  title,
  body,
  onClick,
}: {
  href: string;
  icon: typeof User;
  title: string;
  body?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[#7eb0ff]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-white">{title}</span>
        {body ? <span className="block text-xs text-white/45">{body}</span> : null}
      </span>
      <ChevronRight className="h-4 w-4 text-white/25" />
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-b border-white/5 px-3 py-3 last:border-0">
        {inner}
      </button>
    );
  }
  return (
    <Link href={href} className="flex items-center gap-3 border-b border-white/5 px-3 py-3 last:border-0">
      {inner}
    </Link>
  );
}
