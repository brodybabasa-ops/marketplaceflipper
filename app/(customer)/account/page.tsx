import { CustomerSettingsView } from "@/components/customer-app/settings-view";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { LANDING_LOCATION } from "@/lib/landing";

export const metadata = { title: "Settings" };

export default async function AccountPage() {
  const session = await requireSession();
  const [user, profile] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.id } }),
    prisma.customerProfile.findUnique({ where: { userId: session.id } }),
  ]);
  const location = profile?.city && profile.state ? `${profile.city}, ${profile.state}` : LANDING_LOCATION;
  return (
    <CustomerSettingsView
      firstName={user.firstName}
      lastName={user.lastName}
      email={user.email}
      phone={user.phone ?? ""}
      zip={profile?.zip ?? "84041"}
      location={location}
      avatarUrl={user.avatarUrl}
    />
  );
}
