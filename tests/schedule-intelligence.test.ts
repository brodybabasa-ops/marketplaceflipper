import assert from "node:assert/strict";
import { test } from "node:test";
import { operatingViews, resolveOperatingModel, operatingModelFromForm, resourceKindsForModel } from "../lib/operating-model";
import { checkInState, displayTitle, intersectsNow, isBlockedKind, jobProgressPct, slipRisk, visualTone } from "../lib/schedule-visual";
import {
  authorizationSchedulingHint,
  delayRisk,
  parseNaturalScheduleCommand,
  partsSchedulingHint,
  qualificationMatch,
  recommendedScheduleMinutes,
  travelConflict,
  utilization,
} from "../lib/schedule-intelligence";

test("shop-only operations hide routes and maps", () => {
  const shop = operatingViews(resolveOperatingModel({ serviceMode: "SHOP" }));
  assert.equal(shop.showBays, true);
  assert.equal(shop.showRoutes, false);
  assert.equal(shop.showMap, false);
  assert.ok(!(shop.boardViews as readonly string[]).includes("routes"));
  const mobile = operatingViews(resolveOperatingModel({ serviceMode: "MOBILE" }));
  assert.equal(mobile.showRoutes, true);
  assert.equal(mobile.showBays, false);
  assert.ok(!(resourceKindsForModel("MOBILE_ONLY") as readonly string[]).includes("BAY"));
  assert.ok((resourceKindsForModel("SHOP_ONLY") as readonly string[]).includes("BAY"));
  assert.ok(!(resourceKindsForModel("SHOP_ONLY") as readonly string[]).includes("SERVICE_TRUCK"));
});

test("schedule duration is billed labor plus explicit buffers, not a fabricated prediction", () => {
  const result = recommendedScheduleMinutes({
    laborMinutes: 150,
    includeSetup: true,
    includeRoadTest: true,
    bufferMinutes: 15,
  });
  assert.equal(result.laborMinutes, 150);
  assert.equal(result.scheduleMinutes, 215);
  assert.ok(result.factors.some((item) => /labor/i.test(item)));
});

test("qualification does not treat an empty calendar as expertise", () => {
  const weak = qualificationMatch({ displayName: "Tyler", duty: "BOTH", specialties: [] }, { category: "BRAKES" });
  assert.equal(weak.qualified, false);
  assert.ok(weak.warnings[0]);
  const strong = qualificationMatch({ displayName: "Tyler", duty: "OFF_SITE", specialties: ["BRAKES"] }, { category: "BRAKES", offsite: true });
  assert.equal(strong.qualified, true);
});

test("travel time is a hard conflict for back-to-back off-site work", () => {
  const prev = new Date("2026-09-08T11:00:00");
  const next = new Date("2026-09-08T11:00:00");
  const hit = travelConflict(prev, next, 35);
  assert.equal(hit.ok, false);
  const ok = travelConflict(prev, new Date("2026-09-08T11:40:00"), 35);
  assert.equal(ok.ok, true);
});

test("parts and authorization warnings do not block diagnosis", () => {
  assert.equal(partsSchedulingHint("DELAYED", "DIAGNOSIS"), null);
  assert.ok(partsSchedulingHint("DELAYED", "WORK")?.level === "warning");
  assert.ok(authorizationSchedulingHint("AWAITING_APPROVAL", "WORK")?.level === "warning");
  assert.equal(authorizationSchedulingHint("AWAITING_APPROVAL", "DIAGNOSIS"), null);
});

test("job status and schedule status stay separate", () => {
  const risk = delayRisk({
    endsAt: new Date("2026-09-08T11:00:00"),
    now: new Date("2026-09-08T11:30:00"),
    jobStatus: "DIAGNOSING",
  });
  assert.equal(risk.scheduleStatus, "BEHIND");
  assert.equal(risk.minutesBehind, 30);
  const wrap = delayRisk({
    endsAt: new Date("2026-09-08T09:00:00"),
    now: new Date("2026-09-08T16:00:00"),
    jobStatus: "QUALITY_CHECK",
  });
  assert.equal(wrap.behind, false);
  const ready = delayRisk({
    endsAt: new Date("2026-09-08T09:00:00"),
    now: new Date("2026-09-08T16:00:00"),
    jobStatus: "READY",
  });
  assert.equal(ready.behind, false);
  assert.equal(displayTitle("Board: Brake service"), "Brake service");
  assert.equal(displayTitle("Demo: Oil change"), "Oil change");
});

test("capacity overload is visible without becoming an analytics dashboard", () => {
  const load = utilization(8 * 60, 8 * 60);
  assert.equal(load.pct, 100);
  assert.equal(load.openHours, 0);
  assert.equal(utilization(9 * 60, 8 * 60).overload, true);
});

test("natural-language scheduling suggests and never claims to have booked", () => {
  const result = parseNaturalScheduleCommand("Schedule Sarah’s F-150 brakes with Tyler Thursday afternoon");
  assert.equal(result.understood, true);
  assert.match(result.summary, /confirms/i);
  assert.doesNotMatch(result.summary.toLowerCase(), /booked/);
});

test("hybrid remains shop plus travel, not a third app", () => {
  assert.equal(operatingModelFromForm(true, true), "HYBRID");
  const hybrid = operatingViews("HYBRID");
  assert.equal(hybrid.showHybridLanes, true);
  assert.equal(hybrid.showBays, true);
  assert.equal(hybrid.showTravel, true);
});

test("visual tones keep status and type modes separate and never rely on color alone", () => {
  assert.equal(jobProgressPct("IN_PROGRESS"), 65);
  assert.equal(jobProgressPct("READY"), 95);
  assert.equal(visualTone({ mode: "status", jobStatus: "DIAGNOSING" }).tone, "purple");
  assert.equal(visualTone({ mode: "status", behind: true }).label, "Running late");
  assert.equal(visualTone({ mode: "type", category: "MAINTENANCE" }).tone, "blue");
  const soon = checkInState({ now: new Date("2026-09-07T07:53:00"), startsAt: new Date("2026-09-07T08:00:00") });
  assert.equal(soon, "ARRIVING_SOON");
  const slip = slipRisk({
    currentEndsAt: new Date("2026-09-07T10:00:00"),
    nextStartsAt: new Date("2026-09-07T11:00:00"),
    now: new Date("2026-09-07T10:42:00"),
    behind: true,
    minutesBehind: 42,
  });
  assert.equal(slip, null);
  const hit = slipRisk({
    currentEndsAt: new Date("2026-09-07T11:00:00"),
    nextStartsAt: new Date("2026-09-07T11:00:00"),
    now: new Date("2026-09-07T11:25:00"),
    behind: true,
    minutesBehind: 25,
  });
  assert.equal(hit?.delayMinutes, 25);
});

test("current-time intersection is independent of job status", () => {
  const start = new Date("2026-09-07T13:00:00");
  const end = new Date("2026-09-07T16:00:00");
  assert.equal(intersectsNow(start, end, new Date("2026-09-07T14:00:00")), true);
  assert.equal(intersectsNow(start, end, new Date("2026-09-07T16:00:00")), false);
  assert.equal(isBlockedKind("BREAK"), true);
  assert.equal(isBlockedKind("WORK"), false);
});
