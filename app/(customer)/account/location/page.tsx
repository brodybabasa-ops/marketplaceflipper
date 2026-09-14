import Link from "next/link";
import { AppPageHeader } from "@/components/customer-app/primitives";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { LANDING_LOCATION } from "@/lib/landing";
import { updateLocationAction } from "@/app/actions/account";
import { NEARBY_LOCATIONS } from "@/lib/customer-app";

export const metadata = { title: "Location" };

export default async function AccountLocationPage() {
  const session = await requireSession("CUSTOMER");
  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.id } });
  const location = profile?.city && profile.state ? `${profile.city}, ${profile.state}` : LANDING_LOCATION;
  return (
    <div className="px-4 pt-2">
      <AppPageHeader title="Location & Service Area" subtitle="Shops and availability use this area." />
      <form action={updateLocationAction} className="space-y-3 rounded-[22px] border border-white/10 bg-[#0c1d30] p-4">
        <input
          name="location"
          defaultValue={profile?.zip ?? location}
          placeholder="City or ZIP"
          className="h-11 w-full rounded-xl border border-white/10 bg-[#071422] px-3 text-sm text-white outline-none"
        />
        <p className="text-xs text-white/45">Current: {location}</p>
        <button type="submit" className="h-11 w-full rounded-full bg-[#2f7bff] text-sm font-bold text-white">
          Save location
        </button>
      </form>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {NEARBY_LOCATIONS.map((item) => (
          <form key={item.zip} action={updateLocationAction}>
            <input type="hidden" name="location" value={item.zip} />
            <button type="submit" className="h-10 w-full rounded-xl border border-white/10 bg-[#0c1d30] text-sm font-semibold text-white">
              {item.label}
            </button>
          </form>
        ))}
      </div>
      <Link href="/account" className="mt-6 inline-block text-sm font-semibold text-[#7eb0ff]">
        ← Back to Settings
      </Link>
    </div>
  );
}
