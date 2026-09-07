import Link from "next/link";
import { MechanicCard } from "@/components/mechanics/mechanic-card";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { searchMechanics, one } from "@/services/search";

export const metadata = { title: "Find a mechanic" };

export default async function MechanicsSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = {
    q: one(params.q),
    zip: one(params.zip) ?? "84101",
    vehicle: one(params.vehicle),
    category: one(params.category),
    make: one(params.make),
    mode: one(params.mode),
    rating: one(params.rating),
    verified: one(params.verified),
    price: one(params.price),
    distance: one(params.distance),
    sort: one(params.sort),
    day: one(params.day),
    request: one(params.request),
    industry: one(params.industry),
    asset: one(params.asset),
  };
  const { matches, zip, category } = await searchMechanics(query);
  const best = matches.filter((item) => item.isBestMatch);
  const rest = matches.filter((item) => !item.isBestMatch);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">
        {query.request ? "Providers for your repair" : "Mechanic search"}
      </p>
      <h1 className="mt-1 text-3xl font-bold text-ink">
        {query.request ? "Here are the right people" : "Find a mechanic you can trust"}
      </h1>
      <p className="mt-2 text-muted">
        {zip ? `${zip.city}, ${zip.stateCode}` : "Near you"}
        {category ? ` · looking at ${category.toLowerCase().replaceAll("_", " ")}` : ""}
      </p>

      <form className="mt-6 grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-4">
        <Input name="q" defaultValue={query.q} placeholder="What does your vehicle need?" />
        <Input name="zip" defaultValue={query.zip} placeholder="ZIP or city" />
        <Input name="make" defaultValue={query.make} placeholder="Vehicle make" />
        <Select name="sort" defaultValue={query.sort ?? "recommended"}>
          <option value="recommended">Recommended</option>
          <option value="rating">Highest rated</option>
          <option value="closest">Closest</option>
          <option value="experienced">Most experienced</option>
          <option value="price">Lowest price</option>
        </Select>
        <Select name="category" defaultValue={query.category ?? ""}>
          <option value="">Any service</option>
          {SERVICE_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select name="mode" defaultValue={query.mode ?? ""}>
          <option value="">Mobile or shop</option>
          <option value="MOBILE">Mobile mechanic</option>
          <option value="SHOP">Shop</option>
        </Select>
        <Select name="rating" defaultValue={query.rating ?? ""}>
          <option value="">Any rating</option>
          <option value="4.5">4.5+</option>
          <option value="4.8">4.8+</option>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="verified" value="1" defaultChecked={query.verified === "1"} />
          Verified only
        </label>
        <div className="md:col-span-4">
          <Button type="submit">Update results</Button>
        </div>
      </form>

      {matches.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No mechanics matched those filters" body="Try a wider area, or describe the problem in everyday words." />
        </div>
      ) : (
        <>
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-ink">Best matches</h2>
            <div className="mt-4 grid gap-4">
              {best.map((mechanic) => (
                <div key={mechanic.id}>
                  <MechanicCard mechanic={mechanic} />
                  {mechanic.reasons.length ? (
                    <Card className="mt-2 p-4">
                      <p className="text-sm font-semibold text-ink">Why we recommend {mechanic.firstName}</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted">
                        {mechanic.reasons.map((reason) => (
                          <li key={reason}>✓ {reason}</li>
                        ))}
                      </ul>
                      {mechanic.precisionNote ? <p className="mt-3 text-xs text-muted">{mechanic.precisionNote}</p> : null}
                    </Card>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
          {rest.length ? (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-ink">Other mechanics nearby</h2>
              <div className="mt-4 grid gap-4">
                {rest.map((mechanic) => (
                  <MechanicCard key={mechanic.id} mechanic={mechanic} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <div className="mt-10 flex flex-wrap gap-2">
        <Badge tone="muted">
          <Link href="/mechanics/utah">Mechanics in Utah</Link>
        </Badge>
        <Badge tone="muted">
          <Link href="/mechanics/ford">Ford specialists</Link>
        </Badge>
        <Badge tone="muted">
          <Link href="/mobile-mechanics">Mobile mechanics</Link>
        </Badge>
      </div>
    </div>
  );
}
