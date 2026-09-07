import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/session";
import { SignInForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">
        Demo accounts: customer@, mechanic@, and admin@demo.pocketmechanic.app · Demo1234!
      </p>
      <SignInForm />
      <p className="mt-6 text-sm text-muted">
        New here? <Link className="font-semibold text-ink" href="/sign-up">Get started</Link>
      </p>
    </div>
  );
}
