import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { marketplaceCta } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

type ListingCta = {
  id: string;
  source: string;
  sourceUrl: string;
};

export function OpenOnMarketplace({
  listing,
  className,
}: {
  listing: ListingCta;
  className?: string;
}) {
  const cta = marketplaceCta(listing);
  const classes = cn(
    "btn-gradient inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold",
    className,
  );

  if (cta.external) {
    return (
      <a href={cta.href} target="_blank" rel="noreferrer" className={classes}>
        {cta.label}
        <ExternalLink className="h-4 w-4" />
      </a>
    );
  }

  return (
    <Link href={cta.href} className={classes}>
      {cta.label}
      <ExternalLink className="h-4 w-4" />
    </Link>
  );
}
