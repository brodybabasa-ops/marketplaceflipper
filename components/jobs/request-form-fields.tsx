"use client";

import { FREDS_MARINE_SLUG, PRECISION_AUTO_SLUG } from "@/lib/constants";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useMemo, useState } from "react";

type VehicleOption = {
  id: string;
  label: string;
  marine: boolean;
};

type ShopOption = {
  id: string;
  businessName: string;
  shopCity: string | null;
  shopState: string | null;
  slug: string;
};

export function RequestFormFields({
  vehicles,
  shops,
  defaultVehicleId,
  defaultShopId,
  lockShop,
  zip,
}: {
  vehicles: VehicleOption[];
  shops: ShopOption[];
  defaultVehicleId?: string;
  defaultShopId?: string;
  lockShop?: boolean;
  zip: string;
}) {
  const [vehicleId, setVehicleId] = useState(defaultVehicleId ?? vehicles[0]?.id ?? "");
  const suggestedSlug = vehicles.find((item) => item.id === vehicleId)?.marine ? FREDS_MARINE_SLUG : PRECISION_AUTO_SLUG;
  const suggestedShopId = shops.find((shop) => shop.slug === suggestedSlug)?.id ?? shops[0]?.id ?? "";
  const [shopId, setShopId] = useState(defaultShopId ?? suggestedShopId);
  const selectedShop = useMemo(() => shops.find((shop) => shop.id === shopId) ?? null, [shops, shopId]);
  const shopPlace = [selectedShop?.shopCity, selectedShop?.shopState].filter(Boolean).join(", ");

  return (
    <>
      {lockShop && selectedShop ? (
        <>
          <input type="hidden" name="mechanicProfileId" value={selectedShop.id} />
          <div className="rounded-2xl bg-[#f7f9fc] px-4 py-3">
            <p className="text-xs font-bold tracking-[0.16em] text-[#2f7bff]">SENDING TO</p>
            <p className="mt-1 font-semibold text-navy">{selectedShop.businessName}</p>
            {shopPlace ? <p className="text-sm text-muted">{shopPlace}</p> : null}
          </div>
        </>
      ) : (
        <Field label="Shop">
          <Select
            name="mechanicProfileId"
            value={shopId}
            onChange={(event) => setShopId(event.target.value)}
            required
          >
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.businessName}
                {shop.shopCity ? ` · ${shop.shopCity}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Vehicle">
        <Select
          name="vehicleId"
          value={vehicleId}
          required
          onChange={(event) => {
            const next = event.target.value;
            setVehicleId(next);
            if (!lockShop) {
              const marine = vehicles.find((item) => item.id === next)?.marine;
              const slug = marine ? FREDS_MARINE_SLUG : PRECISION_AUTO_SLUG;
              const match = shops.find((shop) => shop.slug === slug);
              if (match) setShopId(match.id);
            }
          }}
        >
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="What does your vehicle need?">
        <Input name="problemText" required placeholder="e.g. Impeller is noisy at idle" />
      </Field>
      <Field label="More detail (optional)">
        <Textarea name="description" placeholder="When it happens, warning lights, recent work..." />
      </Field>
      <Field label="ZIP code">
        <Input name="zip" required defaultValue={zip} />
      </Field>
    </>
  );
}
