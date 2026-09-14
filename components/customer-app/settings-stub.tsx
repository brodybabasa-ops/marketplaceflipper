import Link from "next/link";
import { AppPageHeader } from "@/components/customer-app/primitives";

export function SettingsStub({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 pt-2">
      <AppPageHeader title={title} />
      <div className="rounded-[22px] border border-white/10 bg-[#0c1d30] p-5 text-sm text-white/70">{body}</div>
      <Link href="/account" className="mt-6 inline-block text-sm font-semibold text-[#7eb0ff]">
        ← Back to Settings
      </Link>
    </div>
  );
}
