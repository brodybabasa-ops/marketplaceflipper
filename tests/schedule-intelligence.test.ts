import assert from "node:assert/strict";
import { test } from "node:test";
import { operatingViews, resolveOperatingModel, operatingModelFromForm, resourceKindsForModel } from "../lib/operating-model";
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
