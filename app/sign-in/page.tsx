import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeForRole, safeInternalPath } from "@/lib/session";
import { SignInForm } from "@/components/auth/auth-forms";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  const next = safeInternalPath((await searchParams).next);
  if (session) redirect(next ?? homeForRole(session.role));
  return (
    <MarketingShell
      title="Welcome"
      accent="back."
      subtitle="Demo: customer@ (Brody) · mechanic@ (Fred's Marine) · sarah.chen@ · admin@demo.pocketmechanic.app · Demo1234!"
      image="/landing/dashboard-hero.png"
    >
      <SignInForm next={next ?? undefined} />
      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link className="font-semibold text-[#2f7bff]" href="/sign-up">
          Get started
        </Link>
      </p>
    </MarketingShell>
  );
}
