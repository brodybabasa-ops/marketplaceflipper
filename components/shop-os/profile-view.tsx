import Link from "next/link";
import { Camera, CheckCircle2, MapPin } from "lucide-react";
import { ShopOsHoursForm } from "@/components/shop-os/hours-form";
import { ShopButton, ShopCard, ShopPageHeader } from "@/components/shop-os/primitives";
import { saveMechanicProfileAction, submitVerificationAction } from "@/app/actions/mechanic";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { shopPhotoFor } from "@/lib/landing";
import { VERIFICATION_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ServiceMode, VerificationLevel } from "@prisma/client";

const PROFILE_TABS = [
  { id: "profile", label: "Profile" },
  { id: "services", label: "Services" },
  { id: "photos", label: "Photos & Media" },
  { id: "certs", label: "Certifications" },
  { id: "area", label: "Service Area" },
  { id: "details", label: "Business Details" },
  { id: "prefs", label: "Preferences" },
] as const;

export function ShopProfileEditor({
  tab,
  profile,
  email,
  phone,
}: {
  tab: (typeof PROFILE_TABS)[number]["id"];
  profile: {
    businessName: string;
    tagline: string | null;
    bio: string;
    yearsExperience: number;
    serviceMode: ServiceMode;
    shopAddress: string | null;
    shopCity: string | null;
    shopState: string | null;
    shopZip: string | null;
    serviceRadiusMiles: number;
    diagnosticPriceCents: number;
    laborRateCents: number;
    mobileFeeCents: number;
    acceptsNewJobs: boolean;
    latitude: number;
    longitude: number;
    slug: string;
    profilePhotoUrl: string | null;
    coverPhotoUrl: string | null;
    verificationLevel: VerificationLevel;
    specialties: { category: string }[];
    certifications: { id: string; name: string; issuer: string; verified: boolean }[];
    availability: { dayOfWeek: string; startTime: string; endTime: string }[];
    verifications: { id: string; level: string; status: string }[];
  };
  email: string;
  phone: string | null;
}) {
  const cover = profile.coverPhotoUrl || shopPhotoFor(profile.slug);
  const logo = profile.profilePhotoUrl || shopPhotoFor(profile.slug);
  const level = VERIFICATION_LEVELS.find((item) => item.value === profile.verificationLevel);
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader
        title="Shop Profile"
        subtitle="Manage how your shop appears on Pocket Mechanic. Keep your information up to date to attract more customers."
        actions={
          <>
            <ShopButton href={`/mechanics/${profile.slug}`} variant="secondary">
              View Public Profile
            </ShopButton>
            {(tab === "profile" || tab === "details") ? (
              <ShopButton type="submit" form="shop-profile-form">
                Save Changes
              </ShopButton>
            ) : null}
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-1 border-b border-[#e6eef6]">
        {PROFILE_TABS.map((item) => (
          <Link
            key={item.id}
            href={`/mechanic/profile?tab=${item.id}`}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold",
              tab === item.id ? "border-[#2f7bff] text-[#2f7bff]" : "border-transparent text-[#6b7c8d]",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "profile" || tab === "details" ? (
        <form id="shop-profile-form" action={saveMechanicProfileAction} className="space-y-4">
          <input type="hidden" name="next" value="/mechanic/profile" />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <ShopCard className="p-5">
              <p className="font-bold">Basic Information</p>
              <div className="mt-4 flex gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#102033]">
                    <Camera className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <Field label="Shop Name">
                    <Input name="businessName" defaultValue={profile.businessName} required />
                  </Field>
                  <Field label="Tagline">
                    <Input name="tagline" defaultValue={profile.tagline ?? ""} />
                  </Field>
                </div>
              </div>
              <div className="mt-3">
                <Field label="Description">
                  <Textarea name="bio" defaultValue={profile.bio} required />
                </Field>
              </div>
            </ShopCard>
            <ShopCard className="overflow-hidden">
              <p className="px-4 pt-4 font-bold">Cover Photo</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" className="mt-3 h-36 w-full object-cover" />
              <p className="px-4 py-3 text-[11px] text-[#8a97a6]">Public listing photo. Upload from a job when photo tools are connected.</p>
            </ShopCard>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <ShopCard className="p-5">
              <p className="font-bold">Contact Information</p>
              <div className="mt-3 space-y-3">
                <Field label="Address">
                  <Input name="shopAddress" defaultValue={profile.shopAddress ?? ""} />
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
                <p className="text-sm text-[#5c6b7a]">Phone {phone ?? "not on file"} · {email}</p>
              </div>
            </ShopCard>
            <ShopCard className="p-5">
              <p className="font-bold">Location</p>
              <div className="mt-3 flex h-40 items-center justify-center rounded-xl bg-[#e8eef4] text-sm text-[#5c6b7a]">
                <MapPin className="mr-2 h-4 w-4 text-[#e23d3d]" />
                {profile.shopCity}, {profile.shopState} ({profile.latitude.toFixed(3)}, {profile.longitude.toFixed(3)})
              </div>
            </ShopCard>
            <ShopCard className="p-5">
              <p className="font-bold">How you work</p>
              <div className="mt-3 space-y-3">
                <Select name="serviceMode" defaultValue={profile.serviceMode}>
                  <option value="SHOP">Shop location</option>
                  <option value="MOBILE">Mobile service</option>
                  <option value="BOTH">Shop + Mobile Service</option>
                </Select>
                <Field label="Service radius (miles)">
                  <Input name="serviceRadiusMiles" type="number" defaultValue={profile.serviceRadiusMiles} />
                </Field>
                <Field label="Years of experience">
                  <Input name="yearsExperience" type="number" defaultValue={profile.yearsExperience} />
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
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="acceptsNewJobs" defaultChecked={profile.acceptsNewJobs} />
                  Accepting new jobs
                </label>
              </div>
            </ShopCard>
          </div>
          <Button type="submit" name="saveShopProfile">
            Save Changes
          </Button>
        </form>
      ) : null}

      {tab === "services" ? (
        <ShopCard className="p-5">
          <p className="font-bold">Services & pricing</p>
          <p className="mt-1 text-sm text-[#6b7c8d]">
            Specialties on file: {profile.specialties.map((item) => item.category.replaceAll("_", " ")).join(", ") || "None listed yet."}
          </p>
          <p className="mt-3 text-sm">
            Diagnostic { (profile.diagnosticPriceCents / 100).toFixed(0) }/hr-equivalent · Labor ${(profile.laborRateCents / 100).toFixed(0)}/hr
          </p>
          <ShopButton href="/mechanic/profile?tab=details" className="mt-4">
            Edit rates
          </ShopButton>
        </ShopCard>
      ) : null}

      {tab === "photos" ? (
        <ShopCard className="p-5">
          <p className="font-bold">Photos & Media</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" className="h-40 w-full rounded-xl object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="h-40 w-full rounded-xl object-cover" />
          </div>
        </ShopCard>
      ) : null}

      {tab === "certs" ? (
        <ShopCard className="p-5">
          <p className="font-bold">Certifications</p>
          {profile.certifications.length === 0 ? (
            <p className="mt-2 text-sm text-[#6b7c8d]">No certifications on file yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {profile.certifications.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2 text-sm">
                  <span>
                    <span className="font-semibold">{item.name}</span>
                    <span className="block text-[12px] text-[#6b7c8d]">{item.issuer}</span>
                  </span>
                  {item.verified ? <CheckCircle2 className="h-4 w-4 text-[#16a34a]" /> : null}
                </li>
              ))}
            </ul>
          )}
        </ShopCard>
      ) : null}

      {tab === "area" ? (
        <ShopCard className="p-5">
          <p className="font-bold">Service Area</p>
          <p className="mt-2 text-sm">
            {profile.shopCity}, {profile.shopState} · {profile.serviceRadiusMiles} mile radius
          </p>
          <ShopButton href="/mechanic/profile?tab=profile" className="mt-4">
            Edit location
          </ShopButton>
        </ShopCard>
      ) : null}

      {tab === "prefs" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <ShopCard className="p-5">
            <p className="mb-3 font-bold">Business Hours</p>
            <ShopOsHoursForm hours={profile.availability} />
          </ShopCard>
          <ShopCard className="p-5">
            <p className="font-bold">Registration & Verification</p>
            <p className="mt-2 text-sm">{level?.label}</p>
            <p className="mt-1 text-sm text-[#6b7c8d]">{level?.description}</p>
            <form action={submitVerificationAction} className="mt-4">
              <Button type="submit" variant="secondary">
                Submit for profile verification
              </Button>
            </form>
            <ul className="mt-3 space-y-1 text-sm text-[#6b7c8d]">
              {profile.verifications.map((item) => (
                <li key={item.id}>
                  {item.level} · {item.status}
                </li>
              ))}
            </ul>
          </ShopCard>
        </div>
      ) : null}
    </div>
  );
}
