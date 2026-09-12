"use client";

import { useMemo, useState } from "react";
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
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const vehicles = useMemo(
    () => customers.find((customer) => customer.id === customerId)?.vehicles ?? [],
    [customerId, customers],
  );

  if (customers.length === 0) {
    return <p className="text-sm text-muted">No customer vehicles on file yet. Incoming requests will add them.</p>;
  }

  return (
    <form action={createShopRepairOrderAction} className="space-y-4">
      <Field label="Customer">
        <Select name="customerId" value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Vehicle">
        <Select name="vehicleId" key={customerId} defaultValue={vehicles[0]?.id} required>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.label}
            </option>
          ))}
        </Select>
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
