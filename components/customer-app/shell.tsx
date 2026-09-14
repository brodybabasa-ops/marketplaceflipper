import type { SessionUser } from "@/lib/session-token";
import { CustomerAppHeader } from "@/components/customer-app/header";
import { CustomerBottomNav } from "@/components/customer-app/bottom-nav";

export function CustomerAppShell({
  user,
  location,
  unreadMessages,
  unreadNotifications,
  avatarUrl,
  children,
}: {
  user: SessionUser;
  location: string;
  unreadMessages: number;
  unreadNotifications: number;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div data-dashboard className="min-h-screen bg-[#071422] text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col">
        <CustomerAppHeader
          user={user}
          location={location}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
          avatarUrl={avatarUrl}
        />
        <main className="flex-1 pb-24">{children}</main>
        <CustomerBottomNav unreadNotifications={unreadNotifications} />
      </div>
    </div>
  );
}
