import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { ShopProfileForm } from "@/components/mechanic/shop-profile-form";
import { submitVerificationAction } from "@/app/actions/mechanic";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { VERIFICATION_LEVELS } from "@/lib/constants";

export const metadata = { title: "Mechanic profile" };

export default async function MechanicProfileSettingsPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { verifications: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
  const level = VERIFICATION_LEVELS.find((item) => item.value === profile.verificationLevel);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-extrabold text-navy">{profile.businessName}</h2>
        <p className="mt-2 text-muted">{level?.label}</p>
        <div className="mt-2">
          <Rating value={profile.averageRating} count={profile.reviewCount} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/mechanics/${profile.slug}`}>View public profile</Link>
          </Button>
        </div>
      </div>
      <Card className="border-0 p-5">
        <h3 className="font-semibold text-navy">Public profile</h3>
        <p className="mt-1 text-sm text-muted">This is what customers see before they request service.</p>
        <div className="mt-4">
          <ShopProfileForm profile={profile} next="/mechanic/profile" submitLabel="Save profile" />
        </div>
      </Card>
      <Card className="border-0 p-5">
        <h3 className="font-semibold text-navy">Verification</h3>
        <p className="mt-2 text-sm text-muted">{level?.description}</p>
        <form action={submitVerificationAction} className="mt-4">
          <Button type="submit" variant="secondary">
            Submit for profile verification
          </Button>
        </form>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {profile.verifications.map((item) => (
            <li key={item.id}>
              {item.level} · {item.status}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
