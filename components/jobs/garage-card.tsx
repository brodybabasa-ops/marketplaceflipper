import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { HealthRing } from "@/components/ui/health-ring";
import { AssetVisual } from "@/components/assets/asset-visual";
import type { GarageCardCopy } from "@/services/assets";

export function GarageCard({
  card,
  href,
  ctaHref,
  ctaLabel = "Fix It",
}: {
  card: GarageCardCopy;
  href?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <Card className="flex h-full min-w-[220px] snap-start flex-col p-3">
      {href ? (
        <Link href={href} className="block">
          <AssetVisual industryKey={card.industryKey} photoUrl={card.photoUrl} title={card.title} />
        </Link>
      ) : (
        <AssetVisual industryKey={card.industryKey} photoUrl={card.photoUrl} title={card.title} />
      )}
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Badge tone="muted">{card.industry}</Badge>
          <h3 className="mt-2 truncate text-base font-semibold text-ink">
            {href ? (
              <Link href={href} className="hover:text-accent">
                {card.title}
              </Link>
            ) : (
              card.title
            )}
          </h3>
          {card.usage ? <p className="mt-0.5 text-xs text-muted">{card.usage}</p> : null}
        </div>
        <HealthRing score={card.health.score} label={card.health.label} size={52} />
      </div>
      {card.health.score == null ? (
        <p className="mt-2 text-[11px] text-muted">Health is from inspection findings, not an invented score.</p>
      ) : null}
      {card.openRecommendations ? (
        <p className="mt-2 text-xs text-warning">
          {card.openRecommendations} open recommendation{card.openRecommendations === 1 ? "" : "s"}
        </p>
      ) : null}
      {card.activeRepair ? <p className="mt-1 text-xs text-accent">Active repair · {card.activeRepair}</p> : null}
      {ctaHref ? (
        <Button asChild className="mt-auto pt-3" size="sm">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </Card>
  );
}
