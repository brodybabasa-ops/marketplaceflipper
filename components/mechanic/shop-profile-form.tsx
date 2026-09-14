import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { saveMechanicProfileAction } from "@/app/actions/mechanic";

type ShopProfileValues = {
  businessName: string;
  tagline: string | null;
  bio: string;
  yearsExperience: number;
  serviceMode: string;
  shopCity: string | null;
  shopState: string | null;
  shopZip: string | null;
  serviceRadiusMiles: number;
  diagnosticPriceCents: number;
  laborRateCents: number;
  mobileFeeCents: number;
  acceptsNewJobs: boolean;
};

export function ShopProfileForm({
  profile,
  next,
  submitLabel,
}: {
  profile: ShopProfileValues;
  next: string;
  submitLabel: string;
}) {
  return (
    <form action={saveMechanicProfileAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Business name">
        <Input name="businessName" defaultValue={profile.businessName} required />
      </Field>
      <Field label="Tagline">
        <Input name="tagline" defaultValue={profile.tagline ?? ""} placeholder="Get it Fixed. Get back out there." />
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
      <label className="flex items-center gap-2 text-sm text-navy">
        <input type="checkbox" name="acceptsNewJobs" defaultChecked={profile.acceptsNewJobs} />
        Accepting new jobs
      </label>
      <Button type="submit" name="saveShopProfile">
        {submitLabel}
      </Button>
    </form>
  );
}
