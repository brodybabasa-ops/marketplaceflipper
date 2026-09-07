import { Badge } from "@/components/ui/card";
import { ShieldCheck, Star } from "lucide-react";

export function TrustBadges({
  verificationLevel,
  lastVerifiedAt,
  isSelect,
  isFoundingProvider,
  foundingNumber,
  verifiedIndustries,
}: {
  verificationLevel: string;
  lastVerifiedAt?: Date | null;
  isSelect?: boolean;
  isFoundingProvider?: boolean;
  foundingNumber?: number | null;
  verifiedIndustries?: string[];
}) {
  return (
    <>
      {verificationLevel === "POCKET_VERIFIED" ? (
        <Badge tone="accent" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          Pocket Mechanic Verified
          {lastVerifiedAt ? ` · ${lastVerifiedAt.toLocaleDateString()}` : ""}
        </Badge>
      ) : null}
      {(verifiedIndustries ?? [])
        .filter((name) => name !== "Automotive")
        .map((name) => (
          <Badge key={name} tone="accent" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            Verified {name}
          </Badge>
        ))}
      {isSelect ? (
        <Badge tone="warning" className="gap-1">
          <Star className="h-3 w-3" />
          Select
        </Badge>
      ) : null}
      {isFoundingProvider ? (
        <Badge tone="muted">Founding Mechanic #{String(foundingNumber ?? "").padStart(3, "0")}</Badge>
      ) : null}
    </>
  );
}
