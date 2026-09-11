"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, ClipboardList, HelpCircle, MapPin, Play, Search } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/input";
import { LANDING_LOCATION, VEHICLE_TYPES } from "@/lib/landing";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Tab = "shop" | "estimate" | "question";

export function HeroSearch() {
  const [tab, setTab] = useState<Tab>("shop");
  const action = tab === "question" ? "/sign-up" : "/mechanics";
  const cta = tab === "shop" ? "Find Shops" : tab === "estimate" ? "Get Estimates" : "Ask a Question";

  return (
    <form action={action} className="rounded-[28px] bg-white p-4 text-left shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-5">
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "shop"} onClick={() => setTab("shop")} icon={Search}>
            Find a Repair Shop
          </TabButton>
          <TabButton active={tab === "estimate"} onClick={() => setTab("estimate")} icon={ClipboardList}>
            Get an Estimate
          </TabButton>
          <TabButton active={tab === "question"} onClick={() => setTab("question")} icon={HelpCircle}>
            Ask a Question
          </TabButton>
        </div>
        <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2f7bff]">
          How it works
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2f7bff] text-white">
            <Play className="h-3 w-3 fill-current" />
          </span>
        </Link>
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-bold text-navy sm:text-2xl">What do you need fixed?</h2>
        <p className="mt-1 text-sm text-muted">Tell us what&apos;s going on and we&apos;ll find the right shops for you.</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.15fr_1.25fr_1fr_auto]">
        <Field label="Vehicle Type">
          <Select name="vehicleType" defaultValue="truck" className="h-12 rounded-xl">
            {VEHICLE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Year / Make / Model">
          <Input name="vehicle" defaultValue="2022 Ford F-250" placeholder="Year, make, model" className="h-12 rounded-xl" />
        </Field>
        <Field label="What needs repaired">
          <Select name="category" defaultValue="SUSPENSION" className="h-12 rounded-xl">
            <option value="SUSPENSION">Front-end work (suspension, steering, etc.)</option>
            {SERVICE_CATEGORIES.filter((item) => item.value !== "SUSPENSION").map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Your Location">
          <div className="relative">
            <Input name="zip" defaultValue={LANDING_LOCATION} className="h-12 rounded-xl pr-10" />
            <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2f7bff]" />
          </div>
        </Field>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2f7bff] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(47,123,255,0.35)] hover:bg-[#2568e8] lg:w-auto"
          >
            {cta}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_auto]">
        <Field label="Describe the issue (optional)">
          <Textarea
            name="q"
            rows={1}
            placeholder="Clunking noise from the front left when hitting bumps..."
            className="min-h-12 resize-none rounded-xl py-3"
          />
        </Field>
        <div className="flex items-end">
          <label className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-navy hover:bg-paper">
            <Camera className="h-4 w-4 text-[#2f7bff]" />
            Add Photos / Video
            <input type="file" accept="image/*,video/*" multiple className="hidden" />
          </label>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy">{label}</span>
      {children}
    </label>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Search;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
        active ? "bg-[#2f7bff] text-white" : "bg-paper text-navy hover:bg-line/70",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}
