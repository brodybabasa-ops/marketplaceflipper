import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/session";
import { getOrCreateShopThread } from "@/services/messages";

export const metadata = { title: "Message shop" };

export default async function StartShopThreadPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "CUSTOMER") redirect(homeForRole(session.role));
  const shop = (await searchParams).shop?.trim();
  if (!shop) redirect("/messages");
  const result = await getOrCreateShopThread(session.id, shop);
  if (!result) redirect("/mechanics");
  redirect(`/messages/${result.thread.id}`);
}
