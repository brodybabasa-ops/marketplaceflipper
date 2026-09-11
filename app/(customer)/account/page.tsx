import { Card } from "@/components/ui/card";
import { ThemedBoard } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Profile" };

export default async function AccountPage() {
  const session = await requireSession();
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
        <p className="font-semibold text-navy">
          {session.firstName} {session.lastName}
        </p>
        <p className="text-sm text-muted">{session.email}</p>
        <p className="mt-2 text-sm capitalize text-muted">{session.role.toLowerCase()}</p>
        <form action={signOutAction} className="mt-6">
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </Card>
    </ThemedBoard>
  );
}
