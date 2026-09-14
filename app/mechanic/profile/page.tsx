import { ShopProfileEditor } from "@/components/shop-os/profile-view";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Shop Profile" };

export default async function MechanicProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { tab: tabParam } = await searchParams;
  const tab = (["profile", "services", "photos", "certs", "area", "details", "prefs"].includes(tabParam ?? "")
    ? tabParam
    : "profile") as "profile" | "services" | "photos" | "certs" | "area" | "details" | "prefs";
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: {
      verifications: { orderBy: { createdAt: "desc" }, take: 5 },
      specialties: true,
      certifications: true,
      availability: true,
      user: true,
    },
  });
  return (
    <ShopProfileEditor
      tab={tab}
      profile={profile}
      email={profile.user.email}
      phone={profile.user.phone}
    />
  );
}
