import { AccountForm } from "@/components/account/account-form";
import { Card } from "@/components/ui/card";
import { ThemedBoard } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export const metadata = { title: "Profile" };

export default async function AccountPage() {
  const session = await requireSession();
  const [user, profile] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.id } }),
    prisma.customerProfile.findUnique({ where: { userId: session.id } }),
  ]);
  return (
    <ThemedBoard
      eyebrow="ACCOUNT"
      title="Your"
      accent="Profile."
      subtitle="The basics we use to keep jobs, messages, and shops attached to you."
      script="Keep It Running."
      image="/landing/dashboard-hero.png"
      wide={false}
    >
      <Card className="border-0 bg-[#f7f9fc] p-5 shadow-none">
        <p className="mb-4 text-sm capitalize text-muted">{session.role.toLowerCase()}</p>
        <AccountForm
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
          phone={user.phone ?? ""}
          zip={profile?.zip ?? "84041"}
        />
        <form action={signOutAction} className="mt-6">
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </Card>
    </ThemedBoard>
  );
}
