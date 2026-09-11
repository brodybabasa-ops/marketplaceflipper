import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { PLATFORM_DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MarketingShell({
  title,
  accent,
  subtitle,
  script,
  image = "/landing/hero-truck.png",
  objectPosition = "object-[72%_center]",
  children,
  wide,
}: {
  title: React.ReactNode;
  accent?: string;
  subtitle?: string;
  script?: string;
  image?: string;
  objectPosition?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div data-landing className="flex min-h-screen flex-col bg-[#071422] text-white">
      <section className="relative overflow-hidden pb-16 pt-28 sm:pt-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className={cn("absolute inset-0 h-full w-full object-cover", objectPosition)} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.94)_0%,rgba(7,20,34,0.72)_48%,rgba(7,20,34,0.28)_100%)]" />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            {title}
            {accent ? (
              <>
                {" "}
                <span className="text-[#2f7bff]">{accent}</span>
              </>
            ) : null}
          </h1>
          {subtitle ? <p className="mt-4 max-w-xl text-lg text-white/75">{subtitle}</p> : null}
          {script ? <p className="font-script mt-4 text-2xl text-white/90">{script}</p> : null}
        </div>
      </section>
      <div className={cn("relative z-10 mx-auto -mt-10 flex-1 px-4 pb-16 sm:px-6", wide ? "max-w-[1100px]" : "max-w-[840px]")}>
        <div className="rounded-[28px] bg-[#eef2f6] p-6 text-navy shadow-[0_18px_40px_rgba(14,28,47,0.12)] sm:p-8">{children}</div>
      </div>
      <MarketingFooter />
    </div>
  );
}

export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Link
        href="/sign-up"
        className="inline-flex w-full max-w-[220px] items-center gap-3 rounded-xl bg-black px-4 py-2.5 text-left text-white"
      >
        <span className="text-2xl leading-none"></span>
        <span>
          <span className="block text-[10px] uppercase tracking-wide text-white/70">Download on the</span>
          <span className="block text-sm font-semibold">App Store</span>
        </span>
      </Link>
      <Link
        href="/sign-up"
        className="inline-flex w-full max-w-[220px] items-center gap-3 rounded-xl bg-black px-4 py-2.5 text-left text-white"
      >
        <span className="text-lg leading-none">▶</span>
        <span>
          <span className="block text-[10px] uppercase tracking-wide text-white/70">Get it on</span>
          <span className="block text-sm font-semibold">Google Play</span>
        </span>
      </Link>
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#071422]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Logo light stacked />
          <p className="mt-3 text-sm text-white/60">Anything Mechanical. Anywhere.</p>
        </div>
        <p className="font-script text-2xl text-white/90">Keep It Running.</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2f7bff] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2568e8]"
          >
            Get the App
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/for-mechanics"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"
          >
            For Shops
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] px-4 pb-8 text-xs leading-5 text-white/40 sm:px-6">
        <p>{PLATFORM_DISCLAIMER}</p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/dispute-policy">Dispute Policy</Link>
          <Link href="/legal/review-policy">Review Policy</Link>
        </div>
      </div>
    </footer>
  );
}
