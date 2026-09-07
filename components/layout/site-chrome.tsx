import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/session";
import { homeForRole } from "@/lib/session";

export function SiteHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <Link href="/mechanics" className="hover:text-navy">
              Find a Mechanic
            </Link>
            <Link href="/how-it-works" className="hover:text-navy">
              How It Works
            </Link>
            <Link href="/for-mechanics" className="hover:text-navy">
              For Mechanics
            </Link>
            <Link href="/pocket-protect" className="hover:text-navy">
              Pocket Protect
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={homeForRole(user.role)}>Dashboard</Link>
              </Button>
              <form action={signOutAction}>
                <Button type="submit" variant="secondary" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">
            Your vehicle. Your mechanic. Your peace of mind.
          </p>
          <p className="mt-4 max-w-lg text-xs leading-5 text-muted">
            Pocket Mechanic connects customers with independent automotive service providers. Mechanics are independent
            service providers and are responsible for the services they perform.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy">Product</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
            <Link href="/mechanics">Find a mechanic</Link>
            <Link href="/mobile-mechanics">Mobile mechanics</Link>
            <Link href="/for-mechanics">Join as a mechanic</Link>
            <Link href="/pocket-protect">Pocket Protect</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy">Legal placeholders</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
            <Link href="/legal/terms">Terms of Service</Link>
            <Link href="/legal/privacy">Privacy Policy</Link>
            <Link href="/legal/dispute-policy">Dispute Policy</Link>
            <Link href="/legal/review-policy">Review Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
