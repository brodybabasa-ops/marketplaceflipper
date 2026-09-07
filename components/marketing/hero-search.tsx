import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch({ compact }: { compact?: boolean }) {
  return (
    <form
      action="/mechanics"
      className={compact ? "grid gap-3 md:grid-cols-4" : "grid gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow)] md:grid-cols-[1fr_1.2fr_1fr_auto]"}
    >
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Vehicle</label>
        <Input name="vehicle" placeholder="Year, make, model" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Problem</label>
        <Input name="q" placeholder="What does your vehicle need?" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Location</label>
        <Input name="zip" placeholder="ZIP code or city" defaultValue="84101" />
      </div>
      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full">
          <Search className="h-4 w-4" />
          Find My Mechanic
        </Button>
      </div>
    </form>
  );
}

export function FindMechanicCta() {
  return (
    <Button asChild size="lg">
      <Link href="/mechanics">Find a Mechanic</Link>
    </Button>
  );
}
