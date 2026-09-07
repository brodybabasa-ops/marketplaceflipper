import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import type { GarageCardCopy } from "@/services/assets";

export function GarageCard({
  card,
  href,
  ctaHref,
  ctaLabel = "Get Help",
}: {
  card: GarageCardCopy;
  href?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.nickname || card.typeName}</p>
        <Badge tone="muted">{card.industry}</Badge>
      </div>
      <h3 className="mt-1 text-xl font-semibold text-ink">
        {href ? (
          <Link href={href} className="hover:text-accent">
            {card.title}
          </Link>
        ) : (
          card.title
        )}
      </h3>
      {card.usage ? <p className="mt-1 text-sm text-muted">{card.usage}</p> : null}
      {card.health.sections.length ? (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {card.health.sections.slice(0, 4).map((section) => (
            <li key={section.section} className="flex justify-between gap-2">
              <span>{section.section}</span>
              <span className="uppercase tracking-wide">{section.status.replaceAll("_", " ").toLowerCase()}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {card.openRecommendations ? (
        <p className="mt-2 text-xs text-warning">{card.openRecommendations} open recommendation{card.openRecommendations === 1 ? "" : "s"}</p>
      ) : null}
      {card.activeRepair ? <p className="mt-1 text-xs text-accent">Active repair · {card.activeRepair}</p> : null}
      {card.lastService ? <p className="mt-1 text-xs text-muted">Last service: {card.lastService}</p> : null}
      {card.primaryProvider ? <p className="mt-1 text-xs text-muted">Provider: {card.primaryProvider}</p> : null}
      {ctaHref ? (
        <Button asChild className="mt-4" size="sm">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </Card>
  );
}
