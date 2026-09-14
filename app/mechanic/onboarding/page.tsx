import { ShopProfileForm } from "@/components/mechanic/shop-profile-form";
import { ShopCard, ShopPageHeader } from "@/components/shop-os/primitives";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader
        title="Set up the shop"
        subtitle={`Profile ${profile.profileCompletePct}% complete. Customers see this before they request service.`}
      />
      <ShopCard className="max-w-xl p-5">
        <ShopProfileForm profile={profile} next="/mechanic" submitLabel="Save and continue" />
      </ShopCard>
    </div>
  );
}
