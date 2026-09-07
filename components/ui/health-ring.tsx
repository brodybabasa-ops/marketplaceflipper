export function HealthRing({
  score,
  label,
  size = 56,
}: {
  score: number | null;
  label?: string | null;
  size?: number;
}) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = score ?? 0;
  const offset = circumference - (value / 100) * circumference;
  const tone = score == null ? "text-muted" : score >= 85 ? "text-success" : score >= 70 ? "text-accent" : "text-warning";
  return (
    <div className="flex flex-col items-center" title={score == null ? "Health appears after a recorded inspection" : `${score}/100 from inspection findings`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-navy" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={score == null ? circumference : offset}
          className={tone}
        />
      </svg>
      <p className={`-mt-[2.85rem] number text-sm font-bold ${tone}`}>{score ?? "—"}</p>
      <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{label ?? "No inspection"}</p>
    </div>
  );
}
