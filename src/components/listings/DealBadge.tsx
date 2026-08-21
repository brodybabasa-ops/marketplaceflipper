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
          ? "bg-copper text-white"
          : good
            ? "bg-accent text-accent-fg"
            : "bg-[#ece7dc] text-foreground",
      )}
    >
      {strong ? "🔥 " : null}
      {score} {label}
    </span>
  );
}
