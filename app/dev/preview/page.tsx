import { notFound } from "next/navigation";
import { isDevPreviewEnabled, DEMO_ACCOUNTS } from "@/lib/vision";
import { DEMO_PASSWORD } from "@/lib/constants";
import { previewDemoAccountAction } from "@/app/actions/vision";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Role preview" };

export default async function PreviewPage() {
  if (!isDevPreviewEnabled()) notFound();
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">Development only</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">Preview a demo role</h1>
      <p className="mt-2 text-sm text-muted">
        This still uses real authentication and the demo password. It does not bypass permissions.
      </p>
      <div className="mt-6 space-y-3">
        {DEMO_ACCOUNTS.map((account) => (
          <Card key={account.email} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-ink">{account.label}</p>
              <p className="text-xs text-muted">{account.email}</p>
            </div>
            <form action={previewDemoAccountAction}>
              <input type="hidden" name="email" value={account.email} />
              <Button type="submit" size="sm">
                Sign in
              </Button>
            </form>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Password for all demo accounts: {DEMO_PASSWORD}</p>
    </div>
  );
}
