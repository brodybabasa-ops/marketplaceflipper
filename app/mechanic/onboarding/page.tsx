import { ShopProfileForm } from "@/components/mechanic/shop-profile-form";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  return (
    <div>
      <p className="text-sm text-muted">
        Profile {profile.profileCompletePct}% complete. Customers see this before they request service.
      </p>
      <div className="mt-6">
        <ShopProfileForm profile={profile} next="/mechanic" submitLabel="Save and continue" />
      </div>
    </div>
  );
}
