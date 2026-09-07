import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  AUTOMOTIVE: "from-sky-900/80 to-navy",
  MARINE: "from-cyan-900/70 to-navy",
  POWERSPORTS: "from-orange-900/50 to-navy",
  RV: "from-indigo-900/70 to-navy",
  HEAVY_EQUIPMENT: "from-amber-900/50 to-navy",
  SMALL_ENGINE: "from-emerald-900/50 to-navy",
  COMMERCIAL_FLEET: "from-slate-700 to-navy",
};

export function AssetVisual({
  industryKey,
  photoUrl,
  title,
  className,
}: {
  industryKey: string;
  photoUrl?: string | null;
  title: string;
  className?: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt="" className={cn("h-28 w-full rounded-2xl object-cover", className)} />
    );
  }
  return (
    <div
      className={cn(
        "flex h-28 w-full items-end justify-between rounded-2xl bg-gradient-to-br px-3 py-2",
        TONE[industryKey] ?? "from-slate-800 to-navy",
        className,
      )}
      aria-hidden
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">{title.split(" ").slice(-1)[0]}</span>
      <span className="text-2xl">{industryKey === "MARINE" ? "🛥️" : industryKey === "POWERSPORTS" ? "🏍️" : industryKey === "RV" ? "🚐" : industryKey === "HEAVY_EQUIPMENT" ? "🏗️" : "🛻"}</span>
    </div>
  );
}
