"use client";

import { useActionState } from "react";
import { updateAccountAction, type AccountState } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function AccountForm({
  firstName,
  lastName,
  email,
  phone,
  zip,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zip: string;
}) {
  const [state, action, pending] = useActionState(updateAccountAction, {} as AccountState);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <Input name="firstName" required defaultValue={firstName} />
        </Field>
        <Field label="Last name">
          <Input name="lastName" required defaultValue={lastName} />
        </Field>
      </div>
      <Field label="Email">
        <Input value={email} readOnly disabled />
      </Field>
      <Field label="Phone">
        <Input name="phone" defaultValue={phone} placeholder="801-555-0100" />
      </Field>
      <Field label="ZIP code">
        <Input name="zip" required defaultValue={zip} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current password">
          <Input name="currentPassword" type="password" autoComplete="current-password" />
        </Field>
        <Field label="New password">
          <Input name="newPassword" type="password" autoComplete="new-password" />
        </Field>
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.saved ? <p className="text-sm text-success">Saved.</p> : null}
      <Button type="submit" name="saveProfile" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
