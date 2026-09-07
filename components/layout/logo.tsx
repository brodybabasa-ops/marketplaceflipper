import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function WrenchMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-8 w-8", className)} aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 4h15.2C36.4 4 44 11.4 44 21.2c0 7.2-4.2 13.2-10.6 15.6L42 44h-8.4L26.8 36H20v8h-8V4Zm8 7.2v17.2h6.1c5.1 0 8.7-3.5 8.7-8.6 0-5.1-3.6-8.6-8.7-8.6H20Zm8.4 5.2c1.7.4 2.5 1.6 2.5 3.4 0 1.8-.8 3-2.5 3.4V16.4Z"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact,
  wordmark = true,
}: {
  className?: string;
  compact?: boolean;
  wordmark?: boolean;
  light?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 tracking-tight", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
        <WrenchMark className="h-6 w-6" />
      </span>
      {wordmark && !compact ? (
        <span className="leading-none">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">Pocket</span>
          <span className="block text-sm font-bold uppercase tracking-[0.12em] text-accent">Mechanic</span>
        </span>
      ) : null}
      <span className="sr-only">{APP_NAME}</span>
    </Link>
  );
}
