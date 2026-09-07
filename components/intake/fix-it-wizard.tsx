"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createRequestAction } from "@/app/actions/marketplace";
import { assistIntake } from "@/lib/intake-assistant";
import { industryByKey } from "@/lib/catalog";
import type { IntakeAssetOption } from "@/components/intake/intake-form";

export function FixItWizard({
  assets,
  defaultAssetId,
  mechanicProfileId,
  defaultZip,
  urgency = "NORMAL",
  requestKind = "REPAIR",
}: {
  assets: IntakeAssetOption[];
  defaultAssetId?: string;
  mechanicProfileId?: string;
  defaultZip?: string;
  urgency?: "NORMAL" | "URGENT";
  requestKind?: "REPAIR" | "MAINTENANCE" | "PRE_PURCHASE" | "ROADSIDE";
}) {
  const initial = defaultAssetId && assets.some((item) => item.id === defaultAssetId) ? defaultAssetId : assets[0]?.id;
  const [step, setStep] = useState(0);
  const [assetId, setAssetId] = useState(initial ?? "");
  const [problemText, setProblemText] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const selected = useMemo(() => assets.find((item) => item.id === assetId) ?? assets[0], [assets, assetId]);
  const copy = industryByKey(selected?.industryKey ?? "AUTOMOTIVE");
  const assist = problemText.trim().length >= 8 ? assistIntake(problemText, selected?.industryKey ?? "AUTOMOTIVE") : null;
  const mixed = new Set(assets.map((item) => item.industryKey)).size > 1;

  if (!assets.length) {
    return (
      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink">Add something to your garage first</h2>
        <p className="mt-2 text-sm text-muted">Fix It starts with what you own. Year, make, and model is enough.</p>
        <Button asChild className="mt-4">
          <Link href="/vehicles/new">Add to garage</Link>
        </Button>
      </Card>
    );
  }

  return (
    <form action={createRequestAction} className="mt-6 space-y-4">
      {mechanicProfileId ? <input type="hidden" name="mechanicProfileId" value={mechanicProfileId} /> : null}
      <input type="hidden" name="assetId" value={assetId} />
      <input type="hidden" name="urgencyMode" value={urgency} />
      {requestKind === "PRE_PURCHASE" ? <input type="hidden" name="prePurchase" value="on" /> : null}
      {requestKind === "MAINTENANCE" ? <input type="hidden" name="requestKind" value="MAINTENANCE" /> : null}

      <div className="flex gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {["Asset", "What happened", "A few details", "Review"].map((label, index) => (
          <span key={label} className={index === step ? "text-accent" : ""}>
            {index + 1}. {label}
          </span>
        ))}
      </div>

      {step === 0 ? (
        <Card className="p-5">
          <Field label={mixed ? "What needs help?" : "Vehicle"}>
            <Select name="assetPicker" value={assetId} onChange={(event) => setAssetId(event.target.value)} required>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.label}
                  {mixed ? ` · ${industryByKey(asset.industryKey).name}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <p className="mt-3 text-sm text-muted">Don’t see it? Add it to your garage — boats, bikes, RVs, and equipment welcome.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => setStep(1)}>
              Continue
            </Button>
            <Button asChild variant="secondary">
              <Link href="/vehicles/new">Add something else</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="p-5">
          <Field label={copy.intakePrompt}>
            <Textarea
              name="problemTextVisible"
              required
              value={problemText}
              onChange={(event) => setProblemText(event.target.value)}
              placeholder={copy.intakePlaceholder}
            />
          </Field>
          {assist ? <p className="mt-3 text-sm text-muted">{assist.routingNote}</p> : <p className="mt-3 text-sm text-muted">Everyday language is enough. Pocket Mechanic matches a provider — it does not diagnose from this description.</p>}
          <div className="mt-4 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="button" disabled={problemText.trim().length < 8} onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="p-5">
          <p className="text-sm text-muted">Optional. Skip anything you don’t know.</p>
          {(assist?.followUps ?? []).map((item) => (
            <Field key={item.id} label={item.prompt}>
              <Input
                value={answers[item.id] ?? ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))}
                placeholder={item.placeholder}
              />
            </Field>
          ))}
          <Field label="ZIP code">
            <Input name="zip" required defaultValue={defaultZip ?? "84101"} />
          </Field>
          <Field label="When are you available?">
            <Input name="preferredDate" type="date" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="mobilePreferred" defaultChecked={urgency === "URGENT"} className="h-4 w-4" />
            Prefer a provider who can come to me
          </label>
          <div className="mt-4 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)}>
              Review request
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Service request</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Asset</dt>
              <dd>{selected?.label}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Complaint</dt>
              <dd className="text-right">{problemText}</dd>
            </div>
            {assist ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Likely specialty</dt>
                <dd>{assist.taxonomyKey.replaceAll("_", " ").toLowerCase()}</dd>
              </div>
            ) : null}
          </dl>
          {assist ? <p className="mt-3 text-sm text-muted">{assist.routingNote}</p> : null}
          <input type="hidden" name="problemText" value={problemText} />
          <input type="hidden" name="whenItHappens" value={answers.conditions ?? ""} />
          <input type="hidden" name="warningLights" value={answers.lights ?? ""} />
          <input type="hidden" name="drivability" value={answers.drive ?? ""} />
          <input type="hidden" name="startedWhen" value={answers.usage ?? answers.attempts ?? ""} />
          <input type="hidden" name="description" value={Object.entries(answers).map(([key, value]) => (value ? `${key}: ${value}` : "")).filter(Boolean).join(" · ")} />
          <div className="mt-4 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="submit">{urgency === "URGENT" ? "Find urgent help" : "Find the right people"}</Button>
          </div>
        </Card>
      ) : null}
    </form>
  );
}
