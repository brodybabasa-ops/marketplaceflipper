import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/session";
import { SignInForm } from "@/components/auth/auth-forms";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  return (
    <MarketingShell
      title="Welcome"
      accent="back."
      subtitle="Demo accounts: customer@, mechanic@, sarah.chen@, and admin@demo.pocketmechanic.app · Demo1234!"
      image="/landing/dashboard-hero.png"
    >
      <SignInForm />
      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link className="font-semibold text-[#2f7bff]" href="/sign-up">
          Get started
        </Link>
      </p>
    </MarketingShell>
  );
}
