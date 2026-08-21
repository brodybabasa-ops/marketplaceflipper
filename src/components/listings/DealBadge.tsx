import { dealScoreLabel } from "@/lib/scoring/deal-score";
import { cn } from "@/lib/utils";

export function DealBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const label = dealScoreLabel(score);
  const strong = score >= 85;
  const good = score >= 70;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        strong
          ? "bg-emerald-500 text-emerald-950"
          : good
            ? "bg-violet-500 text-white"
            : "bg-white/10 text-slate-200",
      )}
    >
      {score} {strong ? "High Profit" : label}
    </span>
  );
}
