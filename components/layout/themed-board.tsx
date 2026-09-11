import Link from "next/link";
import { cn } from "@/lib/utils";
import { KeepRunningBar } from "@/components/layout/keep-running-bar";

export function ThemedBoard({
  eyebrow,
  title,
  accent,
  subtitle,
  script,
  image = "/landing/hero-truck.png",
  objectPosition = "object-[78%_center]",
  children,
  wide = true,
}: {
  eyebrow?: string;
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
    <div className="flex min-h-full flex-col bg-[#e8eef4] text-navy">
      <section className="relative overflow-hidden bg-[#071422] pb-16 pt-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className={cn("absolute inset-0 h-full w-full object-cover", objectPosition)} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.94)_0%,rgba(7,20,34,0.72)_40%,rgba(7,20,34,0.22)_100%)]" />
        <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6">
          {eyebrow ? <p className="text-xs font-semibold tracking-[0.22em] text-white/75">{eyebrow}</p> : null}
          <h1 className="mt-2 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {title}
            {accent ? (
              <>
                {" "}
                <span className="text-[#2f7bff]">{accent}</span>
              </>
            ) : null}
          </h1>
          {subtitle ? <p className="mt-3 max-w-lg text-white/75">{subtitle}</p> : null}
          {script ? <p className="font-script mt-4 text-2xl text-white/90">{script}</p> : null}
        </div>
      </section>
      <div className={cn("relative z-10 mx-auto -mt-8 w-full flex-1 px-4 pb-12 sm:px-6", wide ? "max-w-[1180px]" : "max-w-[840px]")}>
        <div className="overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_18px_40px_rgba(14,28,47,0.10)] sm:p-6">
          {children}
        </div>
      </div>
      <KeepRunningBar />
    </div>
  );
}

export function BoardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded-2xl border border-line bg-[#f7f9fc] p-4 transition hover:bg-[#eef3f9]">
      {children}
    </Link>
  );
}

export function BoardRow({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line bg-[#f7f9fc] p-4">{children}</div>;
}

export function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#f7f9fc] p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="number mt-1 text-3xl font-bold text-navy">{value}</p>
    </div>
  );
}

export function PageHeading({
  title,
  accent,
  subtitle,
}: {
  title: string;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6">
      <h2 className="text-2xl font-extrabold tracking-tight text-navy">
        {title}
        {accent ? (
          <>
            {" "}
            <span className="text-[#2f7bff]">{accent}</span>
          </>
        ) : null}
      </h2>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </header>
  );
}
