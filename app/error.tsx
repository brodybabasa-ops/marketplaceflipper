"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div data-landing className="bg-[#071422] text-white">
      <section className="relative overflow-hidden pb-16 pt-28 sm:pt-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/hero-truck.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[72%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.94)_0%,rgba(7,20,34,0.72)_48%,rgba(7,20,34,0.28)_100%)]" />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Something went <span className="text-[#2f7bff]">wrong.</span>
          </h1>
          <p className="font-script mt-4 text-2xl text-white/90">We&apos;ll get you there.</p>
        </div>
      </section>
      <div className="relative z-10 mx-auto -mt-10 max-w-[840px] px-4 pb-16 sm:px-6">
        <div className="rounded-[28px] bg-[#eef2f6] p-6 text-navy shadow-[0_18px_40px_rgba(14,28,47,0.12)] sm:p-8">
          <p className="text-sm text-muted">{error.message}</p>
          <Button className="mt-6" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
