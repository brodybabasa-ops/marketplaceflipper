"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Field, Input, Textarea } from "@/components/ui/input";
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
  defaultProblem,
  urgency = "NORMAL",
  requestKind = "REPAIR",
}: {
  assets: IntakeAssetOption[];
  defaultAssetId?: string;
  mechanicProfileId?: string;
  defaultZip?: string;
  defaultProblem?: string;
  urgency?: "NORMAL" | "URGENT";
  requestKind?: "REPAIR" | "MAINTENANCE" | "PRE_PURCHASE" | "ROADSIDE";
}) {
  const initial = defaultAssetId && assets.some((item) => item.id === defaultAssetId) ? defaultAssetId : assets[0]?.id;
  const [step, setStep] = useState(defaultProblem && defaultProblem.trim().length >= 8 ? 1 : 0);
  const [assetId, setAssetId] = useState(initial ?? "");
  const [problemText, setProblemText] = useState(defaultProblem ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [zip, setZip] = useState(defaultZip ?? "84101");
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
    <form action={createRequestAction} className="mx-auto mt-6 max-w-lg space-y-4">
      {mechanicProfileId ? <input type="hidden" name="mechanicProfileId" value={mechanicProfileId} /> : null}
      <input type="hidden" name="assetId" value={assetId} />
      <input type="hidden" name="zip" value={zip} />
      {requestKind === "PRE_PURCHASE" ? <input type="hidden" name="prePurchase" value="on" /> : null}
      {requestKind === "MAINTENANCE" || requestKind === "ROADSIDE" ? (
        <input type="hidden" name="requestKind" value={requestKind} />
      ) : null}
      <input type="hidden" name="urgencyMode" value={urgency} />

      {step === 0 ? (
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Fix It</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Tell us what’s going on</h2>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setAssetId(asset.id)}
                className={`min-w-max rounded-full px-3 py-2 text-sm ${assetId === asset.id ? "bg-accent text-white" : "bg-slate text-muted"}`}
              >
                {asset.label}
                {mixed ? ` · ${industryByKey(asset.industryKey).name}` : ""}
              </button>
            ))}
          </div>
          <div className="mt-4">
          <Field label={copy.intakePrompt}>
            <Textarea
              required
              value={problemText}
              onChange={(event) => setProblemText(event.target.value)}
              placeholder={copy.intakePlaceholder}
              className="min-h-24"
            />
          </Field>
          </div>
          <p className="mt-3 text-sm text-muted">Everyday language is enough. Pocket Mechanic matches a provider — it does not diagnose from this description.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="lg" disabled={problemText.trim().length < 8} onClick={() => setStep(1)}>
              Continue
            </Button>
            <Button asChild variant="secondary">
              <Link href="/vehicles/new">Add something else</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 1 && assist ? (
        <div className="space-y-3">
          <div className="rounded-2xl rounded-tl-sm bg-slate px-4 py-3 text-sm text-ink">{assist.routingNote}</div>
          <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-accent px-4 py-3 text-sm text-white">{problemText}</div>
          {(assist.followUps ?? []).map((item) => (
            <Card key={item.id} className="p-4">
              <p className="text-sm font-semibold text-ink">{item.prompt}</p>
              {item.choices?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setAnswers((current) => ({ ...current, [item.id]: choice }))}
                      className={`rounded-full px-3 py-2 text-sm ${answers[item.id] === choice ? "bg-accent text-white" : "bg-navy text-muted"}`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              ) : (
                <Input
                  className="mt-2"
                  value={answers[item.id] ?? ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))}
                  placeholder={item.placeholder}
                />
              )}
            </Card>
          ))}
          <Field label="ZIP code">
            <Input value={zip} onChange={(event) => setZip(event.target.value)} required />
          </Field>
          <Field label="When are you available?">
            <Input name="preferredDate" type="date" />
          </Field>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="mobilePreferred" defaultChecked={urgency === "URGENT"} className="h-4 w-4" />
            Prefer a provider who can come to me
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(2)}>
              Review request
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
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
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" size="lg">{urgency === "URGENT" ? "Find urgent help" : "Find the right people"}</Button>
          </div>
        </Card>
      ) : null}
    </form>
  );
}
