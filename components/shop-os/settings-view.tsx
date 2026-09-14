import Link from "next/link";
import { ShopOsHoursForm } from "@/components/shop-os/hours-form";
import { ShopButton, ShopCard, ShopPageHeader } from "@/components/shop-os/primitives";
import { saveMechanicProfileAction } from "@/app/actions/mechanic";
import { BoardSettings } from "@/components/scheduler/board-settings";
import { TeamSettings, type TeamLane } from "@/components/scheduler/team-settings";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SchedulerBoardLayout } from "@/lib/board-layout";
import type { ServiceMode } from "@prisma/client";

const SETTINGS_TABS = [
  { id: "general", label: "General" },
  { id: "profile", label: "Business Profile", href: "/mechanic/profile" },
  { id: "pricing", label: "Services & Pricing" },
  { id: "notifications", label: "Notifications" },
  { id: "team", label: "Users & Team" },
  { id: "integrations", label: "Integrations" },
  { id: "billing", label: "Billing & Subscription" },
  { id: "security", label: "Security" },
  { id: "privacy", label: "Data & Privacy" },
  { id: "appearance", label: "Appearance" },
] as const;

export function ShopSettingsView({
  tab,
  profile,
  resources,
  layout,
}: {
  tab: string;
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
    availability: { dayOfWeek: string; startTime: string; endTime: string }[];
    slug: string;
    profilePhotoUrl: string | null;
  };
  resources: TeamLane[];
  layout: SchedulerBoardLayout;
}) {
  const current = SETTINGS_TABS.some((item) => item.id === tab) ? tab : "general";
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader
        title="Settings"
        subtitle="Manage your shop, preferences, and account settings."
        actions={
          current === "general" || current === "pricing" ? (
            <ShopButton type="submit" form="shop-settings-form">
              Save Changes
            </ShopButton>
          ) : undefined
        }
      />
      <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="rounded-2xl border border-[#e6eef6] bg-white p-2">
          {SETTINGS_TABS.map((item) => {
            const href = "href" in item && item.href ? item.href : `/mechanic/settings?tab=${item.id}`;
            const active = current === item.id;
            return (
              <Link
                key={item.id}
                href={href}
                className={cn(
                  "block rounded-xl px-3 py-2 text-[13px] font-semibold",
                  active ? "bg-[#e8f1ff] text-[#2f7bff]" : "text-[#5c6b7a] hover:bg-[#f8fafc]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-4">
          {current === "general" || current === "pricing" ? (
            <form id="shop-settings-form" action={saveMechanicProfileAction} className="space-y-4">
              <input type="hidden" name="next" value={`/mechanic/settings?tab=${current}`} />
              <div className="grid gap-4 lg:grid-cols-2">
                <ShopCard className="p-5">
                  <p className="font-bold">Shop Information</p>
                  <div className="mt-3 space-y-3">
                    <Field label="Shop Name">
                      <Input name="businessName" defaultValue={profile.businessName} required />
                    </Field>
                    <Field label="Tagline">
                      <Input name="tagline" defaultValue={profile.tagline ?? ""} />
                    </Field>
                    <Field label="Description">
                      <Textarea name="bio" defaultValue={profile.bio} required />
                    </Field>
                  </div>
                </ShopCard>
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
                  </div>
                </ShopCard>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ShopCard className="p-5">
                  <p className="font-bold">Service Area</p>
                  <div className="mt-3 space-y-3">
                    <Select name="serviceMode" defaultValue={profile.serviceMode}>
                      <option value="SHOP">Shop Location Only</option>
                      <option value="MOBILE">Mobile Service</option>
                      <option value="BOTH">Shop + Mobile Service</option>
                    </Select>
                    <Field label="Service radius">
                      <Input name="serviceRadiusMiles" type="number" defaultValue={profile.serviceRadiusMiles} />
                    </Field>
                    <Field label="Years of experience">
                      <Input name="yearsExperience" type="number" defaultValue={profile.yearsExperience} />
                    </Field>
                  </div>
                </ShopCard>
                <ShopCard className="p-5">
                  <p className="font-bold">Pricing</p>
                  <div className="mt-3 space-y-3">
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
                Save changes
              </Button>
            </form>
          ) : null}

          {current === "general" ? (
            <ShopCard className="p-5">
              <p className="mb-3 font-bold">Business Hours</p>
              <ShopOsHoursForm hours={profile.availability} />
            </ShopCard>
          ) : null}

          {current === "team" ? (
            <div className="rounded-2xl bg-[#071422] p-4 text-white">
              <TeamSettings resources={resources} returnTo="/mechanic/settings?tab=team" />
            </div>
          ) : null}

          {current === "appearance" ? (
            <div className="rounded-2xl bg-[#071422] p-4 text-white">
              <BoardSettings layout={layout} returnTo="/mechanic/settings?tab=appearance" />
            </div>
          ) : null}

          {current === "notifications" ? (
            <ShopCard className="p-5 text-sm text-[#5c6b7a]">
              In-app notifications already fire for new requests, estimate replies, and messages. Email/SMS adapters stay mocked until keys are added.
            </ShopCard>
          ) : null}

          {current === "integrations" ? (
            <ShopCard className="p-5">
              <p className="font-bold">Integrations</p>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  ["QuickBooks", "Not Connected"],
                  ["PartsEdge", "Not Connected"],
                  ["Mercury PartsLink", "Not Connected"],
                ].map(([name, status]) => (
                  <li key={name} className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2">
                    <span className="font-semibold">{name}</span>
                    <span className="text-[#6b7c8d]">{status}</span>
                  </li>
                ))}
              </ul>
            </ShopCard>
          ) : null}

          {current === "billing" ? (
            <ShopCard className="p-5">
              <p className="font-bold">Subscription Plan</p>
              <p className="mt-2 text-2xl font-extrabold">Pro Plan</p>
              <p className="text-sm text-[#6b7c8d]">$99/month — demo billing is not charged.</p>
              <ShopButton href="/mechanic/earnings" className="mt-4">
                View earnings
              </ShopButton>
            </ShopCard>
          ) : null}

          {current === "security" ? (
            <ShopCard className="p-5 text-sm text-[#5c6b7a]">
              Shop owners sign in with the same Pocket Mechanic account. Change password from the demo login credentials only in development.
            </ShopCard>
          ) : null}

          {current === "privacy" ? (
            <ShopCard className="p-5 text-sm text-[#5c6b7a]">
              Job photos, messages, and estimates stay on the live job record. Export and deletion tooling will land with compliance review.
            </ShopCard>
          ) : null}

          <ShopCard className="border-[#f5c2c2] p-5">
            <p className="font-bold text-[#c4453c]">Danger Zone</p>
            <p className="mt-1 text-sm text-[#6b7c8d]">Deleting a shop is not enabled in this demo.</p>
          </ShopCard>
        </div>
      </div>
    </div>
  );
}
