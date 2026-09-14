import { getSession } from "@/lib/session";
import { ShopOsShell } from "@/components/shop-os/shell";
import { prisma } from "@/lib/db";
import { unreadNotificationCount } from "@/services/notifications";
import { unreadMessageCount } from "@/services/messages";

export default async function MechanicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "MECHANIC") return children;
  const [profile, unreadNotifications, unreadMessages] = await Promise.all([
    prisma.mechanicProfile.findUnique({
      where: { userId: session.id },
      select: { businessName: true, shopCity: true, shopState: true, slug: true, profilePhotoUrl: true },
    }),
    unreadNotificationCount(session.id),
    unreadMessageCount(session.id, session.role),
  ]);
  return (
    <ShopOsShell
      user={session}
      shop={{
        name: profile?.businessName ?? "Shop",
        city: profile?.shopCity ?? null,
        state: profile?.shopState ?? null,
        slug: profile?.slug ?? "shop",
        photoUrl: profile?.profilePhotoUrl,
      }}
      unreadNotifications={unreadNotifications}
      unreadMessages={unreadMessages}
    >
      {children}
    </ShopOsShell>
  );
}
