import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/session";
import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Get started" };

export default async function SignUpPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-muted">Customers find help. Mechanics get matched with jobs they can actually do.</p>
      <SignUpForm />
      <p className="mt-6 text-sm text-muted">
        Already have an account? <Link className="font-semibold text-ink" href="/sign-in">Sign in</Link>
      </p>
    </div>
  );
}
