import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function NotFound() {
  return (
    <MarketingShell title="Page" accent="not found." subtitle="That route does not exist, or the shop profile has been removed.">
      <Link href="/" className="inline-flex h-11 items-center rounded-xl bg-[#2f7bff] px-5 text-sm font-semibold text-white">
        Back home
      </Link>
    </MarketingShell>
  );
}
