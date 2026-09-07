import { MechanicAppNav } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { updateNotificationPrefsAction } from "@/app/actions/phase2";
import { saveOperatingModelAction, createTechnicianAction, createResourceAction, createLocationAction } from "@/app/actions/vision";
import { resolveOperatingModel, operatingViews, resourceKindsForModel } from "@/lib/operating-model";
import { FutureSurface } from "@/components/ui/vision";

export const metadata = { title: "Settings" };

export default async function MechanicSettingsPage() {
  const session = await requireSession("MECHANIC");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
  const profile = await prisma.mechanicProfile.findUnique({
    where: { userId: session.id },
    include: { technicianProfiles: { where: { active: true } }, resources: true, locations: true },
  });
  const views = profile ? operatingViews(resolveOperatingModel(profile)) : null;
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <MechanicAppNav current="/mechanic/settings" />
      <h1 className="text-3xl font-bold text-ink">Settings</h1>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">How do you service customers?</h2>
        <p className="mt-1 text-sm text-muted">
          The schedule adapts. Shop-only accounts do not see routes. Mobile-only accounts do not see bays unless you enable in-shop work.
        </p>
        {profile && views ? (
          <form action={saveOperatingModelAction} className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="shop" defaultChecked={views.showBays} />
              Customers bring assets to our location
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="travel" defaultChecked={views.showRoutes} />
              We travel to customers / assets
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="field" defaultChecked={views.model === "FIELD_SERVICE"} />
              Field service at job sites, yards, marinas, or facilities
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="multi" defaultChecked={views.model === "MULTI_LOCATION"} />
              We have more than one location
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="fleet" defaultChecked={views.model === "FLEET_SERVICE"} />
              We primarily maintain fleets
            </label>
            <p className="text-xs text-muted">Current: {views.label}</p>
            <Button type="submit">Save operating model</Button>
          </form>
        ) : null}
      </Card>
      {profile && views ? (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-ink">Technicians</h2>
          <p className="mt-1 text-sm text-muted">Skills and shop vs off-site eligibility drive Smart Fit. A solo operator can stay as one row.</p>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {profile.technicianProfiles.map((tech) => (
              <li key={tech.id}>
                {tech.displayName} · {tech.duty.replaceAll("_", " ").toLowerCase()}
                {tech.specialties.length ? ` · ${tech.specialties.join(", ").toLowerCase()}` : ""}
              </li>
            ))}
          </ul>
          <form action={createTechnicianAction} className="mt-4 space-y-2">
            <Field label="Name">
              <Input name="displayName" required placeholder="Tyler Grant" />
            </Field>
            <Field label="Title">
              <Input name="title" placeholder="Lead technician" />
            </Field>
            <Field label="Works">
              <Select name="duty" defaultValue={views.showRoutes && !views.showBays ? "OFF_SITE" : views.showBays && !views.showRoutes ? "SHOP" : "BOTH"}>
                <option value="SHOP">Shop only</option>
                <option value="OFF_SITE">Off-site / field only</option>
                <option value="BOTH">Both</option>
              </Select>
            </Field>
            <Field label="Specialties (comma-separated)">
              <Input name="specialties" placeholder="BRAKES, ELECTRICAL" />
            </Field>
            <Button size="sm" type="submit">
              Add technician
            </Button>
          </form>
        </Card>
      ) : null}
      {profile && views && (views.showBays || views.showRoutes) ? (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-ink">
            {views.showBays && !views.showRoutes ? "Bays and resources" : views.showRoutes && !views.showBays ? "Service units" : "Resources and service units"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {views.showBays && !views.showRoutes
              ? "Only shop resources appear. Route maps stay off until you enable off-site work."
              : views.showRoutes && !views.showBays
                ? "Field trucks and service units. Bays and lifts stay hidden unless you enable in-shop work."
                : "Shop resources and field units. Travel is required when a technician moves between shop and off-site work."}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {profile.resources.map((item) => (
              <li key={item.id}>
                {item.name} · {item.kind.replaceAll("_", " ").toLowerCase()}
              </li>
            ))}
          </ul>
          <form action={createResourceAction} className="mt-4 space-y-2">
            <Field label="Name">
              <Input name="name" required placeholder={views.showBays ? "Bay 1" : "Truck 12"} />
            </Field>
            <Field label="Kind">
              <Select name="kind" defaultValue={views.showBays ? "BAY" : "SERVICE_TRUCK"}>
                {resourceKindsForModel(resolveOperatingModel(profile)).map((kind) => (
                  <option key={kind} value={kind}>
                    {kind.replaceAll("_", " ").toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
            <Button size="sm" type="submit">
              Add resource
            </Button>
          </form>
        </Card>
      ) : null}
      {profile && views?.showLocations ? (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-ink">Locations</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {profile.locations.map((item) => (
              <li key={item.id}>
                {item.name}
                {item.city ? ` · ${item.city}` : ""}
              </li>
            ))}
          </ul>
          <form action={createLocationAction} className="mt-4 space-y-2">
            <Field label="Name">
              <Input name="name" required placeholder="Layton shop" />
            </Field>
            <Field label="City">
              <Input name="city" placeholder="Layton" />
            </Field>
            <Button size="sm" type="submit">
              Add location
            </Button>
          </form>
        </Card>
      ) : null}
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">Subscription</h2>
        {profile?.subscriptionFeeWaived ? (
          <p className="mt-2 text-sm text-muted">
            Pocket Mechanic PRO subscription is waived
            {profile.isFoundingProvider ? ` for Founding Mechanic #${String(profile.foundingNumber).padStart(3, "0")}` : ""}.
            Marketplace transaction fees still apply unless separately waived.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">Pocket Mechanic PRO is $49/month. Marketplace jobs also include a platform transaction fee.</p>
        )}
      </Card>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">Notifications</h2>
        <p className="mt-1 text-sm text-muted">
          In-app is always on. Email uses Resend when `RESEND_API_KEY` is set; otherwise it is logged. SMS uses Twilio when
          account credentials are set.
        </p>
        <form action={updateNotificationPrefsAction} className="mt-4 space-y-3">
          <Field label="Mobile number for SMS">
            <Input name="phone" defaultValue={user.phone ?? ""} placeholder="+1 801 555 0100" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="emailNotifications" defaultChecked={user.emailNotifications} />
            Email notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="smsNotifications" defaultChecked={user.smsNotifications} />
            SMS notifications (Twilio)
          </label>
          <Button type="submit">Save preferences</Button>
        </form>
      </Card>
      <div className="mt-6">
        <FutureSurface
          title="Portable technician reputation"
          body="Individual technicians can eventually carry verified repair history between shops, subject to privacy rules. Reputation cannot be purchased. Recruiting stays a separate business line."
        />
      </div>
    </div>
  );
}
