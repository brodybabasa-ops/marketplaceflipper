"use client";

import { useActionState } from "react";
import { signInAction, signUpAction, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, {} as AuthState);
  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p> : null}
      <Field label="Email">
        <Input name="email" type="email" required placeholder="you@email.com" />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" required />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, {} as AuthState);
  return (
    <form action={action} className="space-y-4">
      {state.error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{state.error}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name">
          <Input name="firstName" required />
        </Field>
        <Field label="Last name">
          <Input name="lastName" required />
        </Field>
      </div>
      <Field label="Email">
        <Input name="email" type="email" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" required />
      </Field>
      <Field label="I am a">
        <Select name="role" defaultValue="CUSTOMER">
          <option value="CUSTOMER">Vehicle owner</option>
          <option value="MECHANIC">Mechanic</option>
        </Select>
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
