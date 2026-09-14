import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/session";
import { SignUpForm } from "@/components/auth/auth-forms";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = { title: "Get started" };

export default async function SignUpPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  return (
    <MarketingShell
      title="Create your"
      accent="account."
      subtitle="Customers find shops. Shops get matched with jobs they can actually do."
      image="/landing/lifestyle.png"
    >
      <SignUpForm />
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link className="font-semibold text-[#2f7bff]" href="/sign-in">
          Sign in
        </Link>
      </p>
    </MarketingShell>
  );
}
