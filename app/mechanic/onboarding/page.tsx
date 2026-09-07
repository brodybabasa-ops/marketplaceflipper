import { MechanicAppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { saveMechanicProfileAction } from "@/app/actions/mechanic";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { INDUSTRIES } from "@/lib/catalog";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { industries: { include: { industry: true } } },
  });
  const selected = new Set(profile.industries.map((item) => item.industry.key));
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <MechanicAppNav current="/mechanic/profile" />
      <h1 className="text-3xl font-bold text-ink">Set up your mechanic profile</h1>
      <p className="mt-2 text-sm text-muted">Profile {profile.profileCompletePct}% complete. Customers see this before they request service.</p>
      <form action={saveMechanicProfileAction} className="mt-6 space-y-4">
        <Field label="Business name">
          <Input name="businessName" defaultValue={profile.businessName} required />
        </Field>
        <Field label="About your work">
          <Textarea name="bio" defaultValue={profile.bio} required />
        </Field>
        <Field label="Years of experience">
          <Input name="yearsExperience" type="number" defaultValue={profile.yearsExperience} />
        </Field>
        <Field label="How you work">
          <Select name="serviceMode" defaultValue={profile.serviceMode}>
            <option value="MOBILE">I come to the customer</option>
            <option value="SHOP">Customers come to my shop</option>
            <option value="BOTH">Both</option>
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="City">
            <Input name="shopCity" defaultValue={profile.shopCity ?? ""} />
          </Field>
          <Field label="State">
            <Input name="shopState" defaultValue={profile.shopState ?? "UT"} />
          </Field>
          <Field label="ZIP">
            <Input name="shopZip" defaultValue={profile.shopZip ?? ""} />
          </Field>
        </div>
        <Field label="Service radius (miles)">
          <Input name="serviceRadiusMiles" type="number" defaultValue={profile.serviceRadiusMiles} />
        </Field>
        <Field label="Diagnostic price">
          <Input name="diagnosticPrice" defaultValue={(profile.diagnosticPriceCents / 100).toString()} />
        </Field>
        <Field label="Labor rate / hour">
          <Input name="laborRate" defaultValue={(profile.laborRateCents / 100).toString()} />
        </Field>
        <Field label="Mobile fee">
          <Input name="mobileFee" defaultValue={(profile.mobileFeeCents / 100).toString()} />
        </Field>
        <Field label="Industries you service">
          <div className="grid gap-2 rounded-xl border border-line p-3">
            {INDUSTRIES.map((industry) => (
              <label key={industry.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="industryKey"
                  value={industry.key}
                  defaultChecked={selected.size ? selected.has(industry.key) : industry.key === "AUTOMOTIVE"}
                  className="h-4 w-4"
                />
                {industry.name}
              </label>
            ))}
          </div>
        </Field>
        <Button type="submit">Save and continue</Button>
      </form>
    </div>
  );
}
