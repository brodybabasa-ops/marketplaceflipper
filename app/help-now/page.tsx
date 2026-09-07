import { CustomerAppNav } from "@/components/layout/app-nav";
import { FixItWizard } from "@/components/intake/fix-it-wizard";
import { Card } from "@/components/ui/card";
import { Field, Select, Textarea, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { assetLabel, vehicleLabel } from "@/lib/asset-display";
import { createRoadsideAction } from "@/app/actions/vision";
import { FutureSurface } from "@/components/ui/vision";

export const metadata = { title: "Urgent help" };

export default async function HelpNowPage() {
  const session = await requireSession("CUSTOMER");
  const assets = await prisma.asset.findMany({
    where: { ownerId: session.id, status: "ACTIVE" },
    include: { industry: true, vehicle: { include: { make: true, model: true } } },
  });
  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.id } });
  return (
    <div>
      <CustomerAppNav current="/help-now" />
      <h1 className="text-3xl font-bold text-ink">I need help now</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Urgent matching prefers availability, distance, capability, and response time. Roadside partners are not invented — this creates a real urgent service request on the same job architecture.
      </p>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">What kind of help?</h2>
        <form action={createRoadsideAction} className="mt-4 space-y-3">
          <Field label="Asset">
            <Select name="assetId" required>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.vehicle ? vehicleLabel(asset.vehicle) : assetLabel(asset)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Need">
            <Select name="kind" defaultValue="EMERGENCY">
              <option value="TOW">Tow</option>
              <option value="JUMP">Jump start</option>
              <option value="TIRE">Tire change</option>
              <option value="LOCKOUT">Lockout</option>
              <option value="FUEL">Fuel delivery</option>
              <option value="MOBILE_DIAGNOSIS">Mobile diagnosis</option>
              <option value="EMERGENCY">Emergency repair</option>
            </Select>
          </Field>
          <Field label="What happened?">
            <Textarea name="notes" required placeholder="Broke down on I-15 southbound, still in the lane…" />
          </Field>
          <Field label="ZIP">
            <Input name="zip" defaultValue={profile?.zip ?? "84101"} required />
          </Field>
          <Button type="submit">Find urgent help</Button>
        </form>
      </Card>
      <div className="mt-6">
        <FixItWizard
          assets={assets.map((asset) => ({
            id: asset.id,
            vehicleId: asset.vehicleId,
            label: asset.vehicle ? vehicleLabel(asset.vehicle) : assetLabel(asset),
            industryKey: asset.industry.key,
          }))}
          defaultZip={profile?.zip ?? "84101"}
          urgency="URGENT"
        />
      </div>
      <div className="mt-6">
        <FutureSurface
          title="Towing & roadside network"
          body="Dedicated tow/jump partners will plug into this same request. Pocket Mechanic will not fake a truck on the way."
        />
      </div>
    </div>
  );
}
