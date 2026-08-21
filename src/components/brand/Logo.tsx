import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-profit text-sm font-black text-[#042f1e]">
        F
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">FlipFinder</span>
          <span className="block text-[10px] text-muted">Find it. Flip it. Profit.</span>
        </span>
      )}
    </Link>
  );
}
