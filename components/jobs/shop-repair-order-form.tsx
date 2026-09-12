"use client";

import { createShopRepairOrderAction } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

export function ShopRepairOrderForm({
  customers,
}: {
  customers: {
    id: string;
    name: string;
    vehicles: { id: string; label: string }[];
  }[];
}) {
  if (customers.length === 0) {
    return <p className="text-sm text-muted">No customer vehicles on file yet. Incoming requests will add them.</p>;
  }

  return (
    <form action={createShopRepairOrderAction} className="space-y-4">
      <Field label="Customer vehicle">
        <select
          name="vehicleId"
          required
          defaultValue=""
          size={8}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-[#1b2430] outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
        >
          <option value="" disabled>
            Choose a machine
          </option>
          {customers.map((customer) => (
            <optgroup key={customer.id} label={customer.name}>
              {customer.vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {customer.name} · {vehicle.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <Field label="What needs done?">
        <Input name="problemText" required minLength={8} placeholder="e.g. Winterize and impeller inspection" />
      </Field>
      <Field label="Notes (optional)">
        <Textarea name="description" placeholder="Walk-in, parts on the trailer, etc." />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date (optional)">
          <Input name="date" type="date" />
        </Field>
        <Field label="Time (optional)">
          <Input name="time" type="time" />
        </Field>
      </div>
      <Button type="submit">Create repair order</Button>
    </form>
  );
}
