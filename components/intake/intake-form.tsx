"use client";

import { useMemo, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createRequestAction } from "@/app/actions/marketplace";
import { industryByKey } from "@/lib/catalog";

export type IntakeAssetOption = {
  id: string;
  vehicleId: string | null;
  label: string;
  industryKey: string;
};

export function IntakeForm({
  assets,
  defaultAssetId,
  mechanicProfileId,
  defaultZip,
}: {
  assets: IntakeAssetOption[];
  defaultAssetId?: string;
  mechanicProfileId?: string;
  defaultZip?: string;
}) {
  const initial = defaultAssetId && assets.some((item) => item.id === defaultAssetId) ? defaultAssetId : assets[0]?.id;
  const [assetId, setAssetId] = useState(initial ?? "");
  const selected = useMemo(() => assets.find((item) => item.id === assetId) ?? assets[0], [assets, assetId]);
  const copy = industryByKey(selected?.industryKey ?? "AUTOMOTIVE");
  const mixed = new Set(assets.map((item) => item.industryKey)).size > 1;

  return (
    <form action={createRequestAction} className="mt-6 max-w-xl space-y-4">
      {mechanicProfileId ? <input type="hidden" name="mechanicProfileId" value={mechanicProfileId} /> : null}
      <Field label={mixed ? "From your garage" : "Vehicle"}>
        <Select name="assetId" value={assetId} onChange={(event) => setAssetId(event.target.value)} required>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.label}
              {mixed ? ` · ${industryByKey(asset.industryKey).name}` : ""}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Describe the symptoms">
        <Textarea name="problemText" required placeholder={copy.intakePlaceholder} />
      </Field>
      {copy.key === "AUTOMOTIVE" ? (
        <>
          <Field label="When does it happen?">
            <Select name="whenItHappens" defaultValue="not-sure">
              <option value="moving">Moving</option>
              <option value="stopped">Stopped</option>
              <option value="both">Both</option>
              <option value="not-sure">Not sure</option>
            </Select>
          </Field>
          <Field label="Warning lights">
            <Input name="warningLights" placeholder="Check engine, ABS, none" />
          </Field>
          <Field label="Can you drive it?">
            <Select name="drivability" defaultValue="yes">
              <option value="yes">Yes</option>
              <option value="limited">Yes, but carefully</option>
              <option value="no">No, it shouldn't be driven</option>
            </Select>
          </Field>
        </>
      ) : (
        <Field label="When did you notice it?">
          <Input name="startedWhen" placeholder="This weekend / last trip / gradually" />
        </Field>
      )}
      <Field label="More detail (optional)">
        <Input name="description" placeholder="Anything else a technician should know" />
      </Field>
      <Field label="ZIP code">
        <Input name="zip" required defaultValue={defaultZip ?? "84101"} />
      </Field>
      <Field label="Preferred date">
        <Input name="preferredDate" type="date" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="mobilePreferred" defaultChecked className="h-4 w-4" />
        Prefer a provider who can come to me
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="prePurchase" className="h-4 w-4" />
        This is a pre-purchase inspection
      </label>
      <Button type="submit">Find my mechanic</Button>
    </form>
  );
}
