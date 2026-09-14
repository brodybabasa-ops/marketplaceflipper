import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/session";
import { prisma } from "@/lib/db";

export const metadata = { title: "Save shop" };

export default async function AddSavedShopPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "CUSTOMER") redirect(homeForRole(session.role));
  const shop = (await searchParams).shop?.trim();
  if (!shop) redirect("/saved");
  const profile = await prisma.mechanicProfile.findUnique({ where: { id: shop } });
  if (!profile) redirect("/mechanics");
  await prisma.savedMechanic.upsert({
    where: { customerId_mechanicProfileId: { customerId: session.id, mechanicProfileId: profile.id } },
    update: {},
    create: { customerId: session.id, mechanicProfileId: profile.id },
  });
  redirect(`/mechanics/${profile.slug}`);
}
